import React from 'react';
import { MapPin, Heart, Users, Leaf, Award, CheckCircle, Star, Waves } from 'lucide-react';

const AboutPage = () => {
  const values = [
    {
      icon: Heart,
      title: "Filipino Hospitality",
      description: "Experience the warmth and genuine care that defines our service"
    },
    {
      icon: Users,
      title: "Community First",
      description: "Supporting local businesses and preserving Sagay's cultural heritage"
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Committed to eco-friendly practices and marine conservation"
    },
    {
      icon: Award,
      title: "Quality Service",
      description: "Dedicated to providing comfortable, affordable accommodations"
    }
  ];

  const features = [
    "Spacious, air-conditioned rooms",
    "Complimentary high-speed Wi-Fi",
    "24/7 front desk assistance",
    "Free parking facilities",
    "Wheelchair accessible",
    "Welcome amenities kit",
    "Fresh towels daily",
    "Central location in Sagay City"
  ];

  const attractions = [
    {
      name: "Carbin Reef",
      description: "A stunning white sandbar in a 200-hectare marine sanctuary",
      distance: "20 min boat ride"
    },
    {
      name: "Suyac Island Mangrove Eco Park",
      description: "Explore century-old mangroves and diverse wildlife",
      distance: "30 min away"
    },
    {
      name: "Sagay Marine Reserve",
      description: "The largest marine reserve in the Philippines",
      distance: "Nearby"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative h-96 md:h-[32rem] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/background.jpg")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
        
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              About Osner Hotel
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              Your gateway to comfort and convenience in the heart of Sagay City
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* Our Story Section */}
        <div className="mb-20 md:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Located in the vibrant heart of Sagay City, Negros Occidental, Osner Hotel has established itself as a trusted destination for travelers seeking comfort, convenience, and authentic Filipino hospitality.
                </p>
                <p>
                  We pride ourselves on offering affordable yet comfortable accommodations that cater to solo travelers, business guests, and families alike. Our commitment is simple: provide a welcoming, budget-friendly experience without compromising on comfort or quality.
                </p>
                <p>
                  Whether you're in town for business or leisure, exploring the stunning marine reserves, or experiencing the rich cultural heritage of Sagay City, Osner Hotel serves as your perfect home base.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-blue-50 rounded-2xl p-8 border-2 border-blue-200">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Prime Location</h3>
                      <p className="text-gray-700 text-sm">
                        Centrally located with easy access to local attractions, restaurants, and the port for island hopping adventures
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Waves className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Gateway to Nature</h3>
                      <p className="text-gray-700 text-sm">
                        Perfect starting point for exploring Carbin Reef, Suyac Island, and the magnificent Sagay Marine Reserve
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Exceptional Service</h3>
                      <p className="text-gray-700 text-sm">
                        Our friendly staff is dedicated to ensuring your stay is relaxing and memorable
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values Section */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at Osner Hotel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">{value.title}</h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="mb-20 md:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">What We Offer</h2>
              <p className="text-gray-700 mb-8 leading-relaxed">
                At Osner Hotel, we provide modern amenities and thoughtful services designed to make your stay comfortable and convenient. Every room is equipped with everything you need for a relaxing experience.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Perfect for Everyone</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Solo Travelers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Business Professionals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Families on Vacation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Adventure Seekers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Marine Enthusiasts</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Languages Spoken</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium text-sm">English</span>
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium text-sm">Filipino</span>
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium text-sm">Hiligaynon</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explore Sagay Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Sagay City</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the natural wonders and attractions near Osner Hotel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attractions.map((attraction, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="h-full flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{attraction.name}</h3>
                  <p className="text-gray-700 text-sm mb-4 flex-grow">{attraction.description}</p>
                  <div className="flex items-center gap-2 text-blue-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{attraction.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience Osner Hotel?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your stay with us today and discover why guests choose Osner Hotel for their Sagay City adventures
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              Book Now
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            © 2025 Osner Hotel, Sagay City. Where love for nature begins.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
