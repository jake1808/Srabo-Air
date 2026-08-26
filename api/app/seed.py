from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from .models import db, User, AirWayBill

USERS=[
    {
        "name": "admin",
        "email": "admin@example.com",
        "password_hash": generate_password_hash("123456", method='pbkdf2:sha256'),
        "role": "admin"
    },
    {
        "name": "clerk",
        "email": "clerk@example.com",
        "password_hash": generate_password_hash("123456", method='pbkdf2:sha256'),
        "role": "clerk"
    }
]

def _awbs(admin_id):
    """Sample air waybills with dates spread around today for filter testing."""
    today = datetime.now().replace(hour=10, minute=30, second=0, microsecond=0)
    rows = [
        ("583-10023541", "Bavaria Motors GmbH", "FRA", today + timedelta(days=9), "EUR", "cartons, machinery parts", 412.50, 412.50, 3.80, 1567.50, 6, "ops@bavariamotors.de"),
        ("583-10023542", "Nairobi Flower Co.", "NBO", today - timedelta(days=3), "USD", "perishables, fresh flowers", 1180.00, 1180.00, 2.95, 3481.00, 14, "logistics@nairobiflower.co.ke"),
        ("583-10023543", "Emirates Tech Supplies", "DXB", today + timedelta(days=2), "USD", "crates, electronic components", 655.75, 690.00, 4.10, 2829.00, 3, "imports@emiratestech.ae"),
        ("583-10023544", "Hong Kong Textiles Ltd", "HKG", today + timedelta(days=16), "USD", "bales, fabric rolls", 2040.00, 2040.00, 2.40, 4896.00, 22, "shipping@hktextiles.com"),
        ("583-10023545", "Amsterdam Pharma BV", "AMS", today - timedelta(days=12), "EUR", "cool containers, vaccines", 310.20, 350.00, 6.75, 2362.50, 2, "coldchain@amspharma.nl"),
        ("583-10023546", "Sao Paulo Foods SA", "GRU", today + timedelta(days=5), "USD", "pallets, frozen meat", 2875.00, 2875.00, 2.10, 6037.50, 18, "export@spfoods.com.br"),
        ("583-10023547", "London Arts & Frames", "LHR", today - timedelta(days=1), "GBP", "crates, exhibition pieces", 96.40, 120.00, 8.50, 1020.00, 4, "receiving@londonarts.co.uk"),
        ("583-10023548", "JFK Auto Parts Inc", "JFK", today + timedelta(days=23), "USD", "cases, brake assemblies", 748.90, 748.90, 3.55, 2658.60, 8, "warehouse@jfkautoparts.com"),
    ]
    return [
        AirWayBill(
            awb_no=r[0], consignee=r[1], airport=r[2], flight_date=r[3], currency=r[4],
            nops=r[5], gross_weight=r[6], chargeable_weight=r[7], rate=r[8], total=r[9],
            nog=r[10], contact=r[11],
            total_prepaid=r[9], total_collect=0, cccdc=0,
            expiry_date=r[3] + timedelta(days=90),
            created_by=admin_id,
        )
        for r in rows
    ]

def seed_db():
    if User.query.count() == 0:
        for user_data in USERS:
            user = User(**user_data)
            db.session.add(user)
        db.session.commit()
        print("Database seeded with initial users.")

    if AirWayBill.query.count() == 0:
        admin = User.query.filter_by(email="admin@example.com").first()
        for awb in _awbs(admin.id if admin else None):
            db.session.add(awb)
        db.session.commit()
        print("Database seeded with sample air waybills.")
