// Mahamitra Contact Information
export const CONTACT_INFO = {
  company: {
    name: 'MAHAMITRA',
    fullName: 'Mahamitra',
    tagline: 'Premium Fashion Destination',
    gstin: '33AQWPR5424R1ZT',
  },
  managingPartner: {
    name: 'Ms. Ramya',
    title: 'Managing Partner',
  },
  address: {
    line1: '210F, 1st Floor',
    line2: 'Bharathiar Road',
    line3: 'New Sidhapudur',
    city: 'Coimbatore',
    pincode: '641044',
    state: 'Tamil Nadu',
    country: 'India',
    full: '210F, 1st Floor, Bharathiar Road, New Sidhapudur, Coimbatore – 641044, Tamil Nadu',
  },
  phone: {
    primary: '+91 95008 44405',
    display: '+91 95008 44405',
  },
  email: {
    primary: 'mahamitrafashions@gmail.com',
    support: 'mahamitrafashions@gmail.com',
  },
  social: {
    instagram: {
      handle: 'mahamitrafashions',
      url: 'https://instagram.com/mahamitrafashions',
    },
    website: {
      url: 'https://www.mahamitra.app',
    },
    whatsapp: {
      number: '+91 95008 44405',
      url: 'https://wa.me/9500844405',
    },
  },
  businessHours: {
    weekdays: 'Mon - Sat: 10:00 AM - 8:00 PM',
    weekends: 'Sunday: 11:00 AM - 6:00 PM',
  },
  maps: {
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.122!2d76.9642155!3d11.0168874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc1c81e183ed282!2sBharathiar%20Rd%2C%20New%20Siddhapudur%2C%20Coimbatore%2C%20Tamil%20Nadu%20641044!5e0!3m2!1sen!2sin!4v1709635200000!5m2!1sen!2sin',
    directionsUrl: 'https://maps.google.com/maps?q=210F,+1st+Floor,+Bharathiar+Road,+New+Sidhapudur,+Coimbatore,+Tamil+Nadu+641044',
  },
} as const;

// Helper functions for formatting
export const formatAddress = (options: {
  includeGSTIN?: boolean;
  multiLine?: boolean;
} = {}) => {
  const { includeGSTIN = false, multiLine = false } = options;
  const separator = multiLine ? '\n' : ', ';
  
  let address = [
    CONTACT_INFO.address.line1,
    CONTACT_INFO.address.line2,
    CONTACT_INFO.address.line3,
    `${CONTACT_INFO.address.city} – ${CONTACT_INFO.address.pincode}`,
    CONTACT_INFO.address.state,
  ].join(separator);

  if (includeGSTIN) {
    address += `${multiLine ? '\n' : ' | '}GSTIN: ${CONTACT_INFO.company.gstin}`;
  }

  return address;
};

export const formatBusinessHours = () => {
  return `${CONTACT_INFO.businessHours.weekdays}\n${CONTACT_INFO.businessHours.weekends}`;
};

export const getContactEmail = (type: 'primary' | 'support' = 'primary') => {
  return CONTACT_INFO.email[type];
};

export const getPhoneNumber = (formatted: boolean = true) => {
  return formatted ? CONTACT_INFO.phone.display : CONTACT_INFO.phone.primary.replace(/\s+/g, '');
};