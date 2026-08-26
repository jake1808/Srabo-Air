from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash=db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(80), nullable=False)
    active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return{
               "id":self.id, 
               "name":self.name, 
               "email":self.email, 
               'role':self.role,
               'active':self.active
               }

class AirWayBill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    awb_no=db.Column(db.String(120), nullable=False)
    consignee=db.Column(db.String(256), nullable=False)
    airport=db.Column(db.String(120), nullable=False)
    flight_date=db.Column(db.DateTime, nullable=False)
    currency=db.Column(db.String(30), nullable=False)
    nops=db.Column(db.String(120), nullable=False)
    gross_weight=db.Column(db.Numeric(10, 2), nullable=False)
    chargeable_weight=db.Column(db.Numeric(10, 2), nullable=False)
    rate=db.Column(db.Numeric(10, 2), nullable=False)
    total=db.Column(db.Numeric(10, 2), nullable=False)
    nog=db.Column(db.Numeric(10, 2), nullable=False)
    contact=db.Column(db.String(256), nullable=False)
    total_prepaid=db.Column(db.Numeric(10, 2), nullable=False)
    total_collect=db.Column(db.Numeric(10, 2), nullable=False)
    cccdc=db.Column(db.Numeric(10, 2), nullable=False)
    expiry_date=db.Column(db.DateTime, nullable=False)
    pdf=db.Column(db.Text)
    created_by=db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at=db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_by=db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    updated_at=db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    def to_dict(self):
        return{
               "id":self.id, 
               "awb_no":self.awb_no, 
               "consignee":self.consignee, 
               'airport':self.airport,
               'flight_date':self.flight_date,
               'currency':self.currency,
               'nops':self.nops,
               'gross_weight':self.gross_weight,
               'chargeable_weight':self.chargeable_weight,
               'rate':self.rate,
               'total':self.total,
               'nog':self.nog,
               'contact':self.contact,
               'total_prepaid':self.total_prepaid,
               'total_collect':self.total_collect,
               'cccdc':self.cccdc,
               'expiry_date':self.expiry_date,
               'pdf':self.pdf,
               'created_by':self.created_by,
               'created_at':self.created_at,
               'updated_by':self.updated_by,
               'updated_at':self.updated_at
               }