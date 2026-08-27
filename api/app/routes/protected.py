from datetime import datetime

from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from app.middleware import token_required
from ..models import AirWayBill, db
import base64

protected_bp = Blueprint('protected', __name__)


def _awb_list_dict(awb):
    """Row for list responses — everything the UI shows, minus the base64 pdf."""
    return {
        'id': awb.id,
        'awb_no': awb.awb_no,
        'consignee': awb.consignee,
        'airport': awb.airport,
        'flight_date': awb.flight_date.isoformat() if awb.flight_date else None,
        'currency': awb.currency,
        'nops': str(awb.nops) if awb.nops is not None else None,
        'gross_weight': str(awb.gross_weight) if awb.gross_weight is not None else None,
        'chargeable_weight': str(awb.chargeable_weight) if awb.chargeable_weight is not None else None,
        'rate': str(awb.rate) if awb.rate is not None else None,
        'total': str(awb.total) if awb.total is not None else None,
        'nog': awb.nog,
        'contact': awb.contact,
        'total_prepaid': str(awb.total_prepaid) if awb.total_prepaid is not None else None,
        'total_collect': str(awb.total_collect) if awb.total_collect is not None else None,
        'cccdc': str(awb.cccdc) if awb.cccdc is not None else None,
        'expiry_date': awb.expiry_date.isoformat() if awb.expiry_date else None,
    }


@protected_bp.route('/', methods=['GET'])
@token_required
def home(current_user):
    # pagination
    try:
        page = max(1, int(request.args.get('page', 1)))
    except ValueError:
        page = 1
    try:
        per_page = min(100, max(1, int(request.args.get('per_page', 50))))
    except ValueError:
        per_page = 50

    query = AirWayBill.query

    # search across the text columns shown in the table
    q = (request.args.get('q') or '').strip()
    if q:
        like = f'%{q}%'
        query = query.filter(or_(
            AirWayBill.awb_no.ilike(like),
            AirWayBill.consignee.ilike(like),
            AirWayBill.airport.ilike(like),
            AirWayBill.nog.ilike(like),
            AirWayBill.contact.ilike(like),
        ))

    # flight-date range filter (dates arrive as YYYY-MM-DD from the date inputs)
    try:
        date_from = request.args.get('from')
        if date_from:
            query = query.filter(AirWayBill.flight_date >= datetime.strptime(date_from, '%Y-%m-%d'))
        date_to = request.args.get('to')
        if date_to:
            query = query.filter(AirWayBill.flight_date <= datetime.strptime(date_to, '%Y-%m-%d'))
    except ValueError:
        return jsonify({"error": "Invalid date filter — expected YYYY-MM-DD"}), 400

    pagination = query.order_by(AirWayBill.flight_date.desc(), AirWayBill.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "message": "You have accessed a protected route!",
        "user": current_user.to_dict(),
        "airwaybills": [_awb_list_dict(a) for a in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "total_pages": pagination.pages,
    }), 200

@protected_bp.route('/create_awb', methods=['POST'])
@token_required
def create_awb(current_user):
    data = request.form
    
    if 'pdf' not in data and 'pdf' not in request.files:
        return jsonify({"message": "No PDF file provided."}), 400
    
    pdf_file = data.get('pdf') or request.files['pdf']
    
    if pdf_file.filename == '':
        return jsonify({"message": "No selected file."}), 400
    
    if not pdf_file.filename.lower().endswith('.pdf'):
        return jsonify({"message": "File is not a PDF."}), 400
    
    pdf_bytes= pdf_file.read()
    bit_64_string = base64.b64encode(pdf_bytes).decode('utf-8')
    
    
    new_awb = AirWayBill(
        awb_no=data['awb_no'],
        consignee=data['consignee'],
        airport=data['airport'],
        flight_date=data['flight_date'],
        currency=data['currency'],
        nops=data['nops'],
        gross_weight=data['gross_weight'],
        chargeable_weight=data['chargeable_weight'],
        rate=data['rate'],
        total=data['total'],
        nog=data['nog'],
        contact=data['contact'],
        total_prepaid=data.get('total_prepaid', 0),
        total_collect=data.get('total_collect', 0),
        cccdc=data.get('cccdc', 0),
        expiry_date=data.get('expiry_date'),
        created_by=current_user.id,
        pdf=bit_64_string
    )
    db.session.add(new_awb)
    db.session.commit()
    return jsonify({"message": "Air Waybill created successfully!", "awb": new_awb.to_dict()}), 201