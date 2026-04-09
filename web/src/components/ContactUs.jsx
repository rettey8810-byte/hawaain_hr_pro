import { Mail, Phone, MessageCircle, MapPin, Clock, Building2 } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1A2B48] mb-4 font-['Plus_Jakarta_Sans']">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600">
            Get in touch with our team for support or inquiries
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Company Info */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#1A2B48]">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-[#1A2B48] rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="ml-4 text-2xl font-bold text-[#1A2B48] font-['Plus_Jakarta_Sans']">
                Hawaain Pvt Ltd
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Your trusted partner for HR Factory - Comprehensive HR Management Solutions
            </p>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-3 text-[#2DD4BF]" />
                <span>Available Sunday - Thursday</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-[#2DD4BF]" />
                <span>Maldives</span>
              </div>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#2DD4BF]">
            <h2 className="text-2xl font-bold text-[#1A2B48] mb-6 font-['Plus_Jakarta_Sans']">
              Quick Contact
            </h2>
            <div className="space-y-6">
              {/* Email */}
              <a
                href="mailto:retey.ay@hotmail.com"
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-[#1A2B48] hover:text-white transition-all duration-300 group"
              >
                <div className="p-3 bg-[#F59E0B] rounded-lg group-hover:bg-white">
                  <Mail className="h-6 w-6 text-white group-hover:text-[#F59E0B]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 group-hover:text-teal-200">Email</p>
                  <p className="font-semibold">retey.ay@hotmail.com</p>
                </div>
              </a>

              {/* WhatsApp/Viber */}
              <a
                href="https://wa.me/9609795572"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-[#1A2B48] hover:text-white transition-all duration-300 group"
              >
                <div className="p-3 bg-[#2DD4BF] rounded-lg group-hover:bg-white">
                  <MessageCircle className="h-6 w-6 text-white group-hover:text-[#2DD4BF]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 group-hover:text-teal-200">WhatsApp / Viber</p>
                  <p className="font-semibold">+960 9795572</p>
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+9609795572"
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-[#1A2B48] hover:text-white transition-all duration-300 group"
              >
                <div className="p-3 bg-[#1A2B48] rounded-lg group-hover:bg-white">
                  <Phone className="h-6 w-6 text-white group-hover:text-[#1A2B48]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 group-hover:text-teal-200">Phone</p>
                  <p className="font-semibold">+960 9795572</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-[#1A2B48] to-[#2DD4BF] rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 font-['Plus_Jakarta_Sans']">
            Need Technical Support?
          </h2>
          <p className="text-teal-100 mb-6">
            Our support team is ready to assist you with any issues or questions about HR Factory.
            We typically respond within 24 hours during business days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold mb-1">24h</p>
              <p className="text-sm text-teal-100">Response Time</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold mb-1">98%</p>
              <p className="text-sm text-teal-100">Satisfaction Rate</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold mb-1">5★</p>
              <p className="text-sm text-teal-100">Support Rating</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>HR Factory - A Product of Hawaain Pvt Ltd</p>
          <p className="mt-1">© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
