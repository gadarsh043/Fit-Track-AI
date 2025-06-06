import { Link } from 'react-router-dom';

function Policy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary-900">
              FitTrack AI
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Policy & Information</h1>
          
          <div className="space-y-8 text-gray-700">
            {/* Business Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">FitTrack AI Solutions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Business Address</h4>
                    <address className="not-italic text-gray-600">
                      Arshiya Sky<br />
                      Abhanpur, Jagdalpur<br />
                      Chhattisgarh 494001<br />
                      India
                    </address>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="text-gray-600">
                      <p><strong>Primary Phone:</strong> +91 999 307 0203</p>
                      <p><strong>Alternative Phone:</strong> +1 469 347 2862</p>
                      <p><strong>Email:</strong> g.adarsh043+support@gmail.com</p>
                      <p><strong>Business Hours:</strong> Mon-Fri 9AM-6PM IST</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Service Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Details</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="mb-4"><strong>Industry:</strong> Software as a Service (SaaS) - Fitness Technology</p>
                <p className="mb-4"><strong>Services:</strong> AI-powered fitness and nutrition tracking platform</p>
                <p className="mb-4"><strong>Development:</strong> Developed in-house by FitTrack AI team</p>
                <p className="mb-4"><strong>Target Market:</strong> Fitness enthusiasts and professional athletes</p>
                
                <h4 className="font-semibold mt-6 mb-2">Platform Features:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Workout tracking and progress monitoring</li>
                  <li>Nutrition logging and macro tracking</li>
                  <li>AI-powered insights and recommendations</li>
                  <li>Water intake and supplement tracking</li>
                  <li>Progress analytics and visualization</li>
                </ul>
              </div>
            </section>

            {/* Development & Infrastructure */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Development & Infrastructure</h2>
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-4">In-House Development</h4>
                <p className="mb-4">✅ <strong>All business logic, features, and application code are developed 100% in-house</strong> by our FitTrack AI development team. No third-party development services are used.</p>
                
                <h4 className="font-semibold mt-6 mb-4">Infrastructure Services (Third-Party)</h4>
                <p className="mb-3">We utilize industry-standard infrastructure services for hosting and data management:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Firebase (Google):</strong> Database hosting and user authentication infrastructure</li>
                  <li><strong>Netlify:</strong> Web application hosting and deployment platform</li>
                  <li><strong>GitHub:</strong> Code repository and version control system</li>
                </ul>
                
                <div className="mt-4 p-4 bg-white rounded border-l-4 border-green-500">
                  <p className="text-sm"><strong>Note:</strong> These are infrastructure-as-a-service platforms, not development or business logic services. All application features, algorithms, and business processes are proprietary and developed in-house.</p>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Customer Support</h4>
                    <p className="text-gray-600 mb-2">Email: g.adarsh043+support@gmail.com</p>
                    <p className="text-gray-600 mb-2">Phone: +91 999 307 0203</p>
                    <p className="text-gray-600">Alternative: +1 469 347 2862</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Business Address</h4>
                    <address className="not-italic text-gray-600">
                      FitTrack AI Solutions<br />
                      Arshiya Sky, Abhanpur<br />
                      Jagdalpur, Chhattisgarh 494001<br />
                      India
                    </address>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Policy; 