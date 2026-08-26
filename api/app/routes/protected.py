from flask import Blueprint, request, jsonify
from app.middleware import token_required
from ..models import AirWayBill, db
import base64

protected_bp = Blueprint('protected', __name__)



@protected_bp.route('/', methods=['GET'])
@token_required
def home(current_user):
    airwaybills = AirWayBill.query.order_by(AirWayBill.flight_date.desc()).all()
    return jsonify({
        "message":"You have accessed a protected route!", 
        "user": current_user.to_dict(), "airwaybills": [awb.to_dict() for awb in airwaybills]}), 200 

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