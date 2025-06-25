export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-primary-600">Literati</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your AI-powered reading companion that transforms how you understand 
            and interact with complex literature.
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🚀 Development Status
            </h2>
            <p className="text-gray-600">
              Currently building Phase 1, Month 1 - Project Setup & Authentication
            </p>
            <div className="mt-4 bg-gray-100 rounded-lg p-4">
              <div className="text-sm text-gray-500">Progress: Initial Setup</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full w-1/12"></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📚 Smart Reading
              </h3>
              <p className="text-gray-600 text-sm">
                Upload EPUB files and get AI-powered insights about characters, 
                themes, and historical context.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🤖 AI Companion
              </h3>
              <p className="text-gray-600 text-sm">
                Ask questions about your reading and get personalized explanations 
                tailored to your understanding level.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📖 Cross-Platform
              </h3>
              <p className="text-gray-600 text-sm">
                Works with Kindle, Apple Books, PDFs, and web readers for a 
                unified reading experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}