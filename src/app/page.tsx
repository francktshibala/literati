import UploadForm from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            <span className="text-primary-600">Literati</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your AI-powered reading companion for understanding complex literature
          </p>
          
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              🔥 NEW: EPUB Upload Now Available!
            </span>
          </div>
        </div>

        {/* Upload Form Section */}
        <div className="mb-12">
          <UploadForm />
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Reading</h3>
              <p className="text-gray-600">AI-powered insights and explanations as you read complex literature</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Companion</h3>
              <p className="text-gray-600">Ask questions and get personalized explanations tailored to your understanding</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">🌐</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Cross-Platform</h3>
              <p className="text-gray-600">Seamless experience across all your reading platforms and devices</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Development Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-primary-500 h-4 rounded-full w-2/12"></div>
            </div>
            <p className="text-gray-600">
              <strong>Phase 1, Month 1:</strong> EPUB Processing & Core Features
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ✅ FILE-001a: Basic EPUB upload with security validation
            </p>
          </div>

          <div className="text-center">
            <a 
              href="/about" 
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Learn More About Literati
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}