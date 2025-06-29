export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About{' '}
            <span className="text-primary-600">Literati</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transforming how readers understand and interact with complex literature 
            through the power of artificial intelligence.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Mission Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
              We believe that great literature should be accessible to everyone. Literati bridges 
              the gap between complex classical texts and modern readers by providing intelligent, 
              contextual assistance that enhances understanding without replacing the joy of discovery.
            </p>
          </div>

          {/* Market Opportunity */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              The Opportunity
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-primary-600 mb-4">
                  $41.6B Education Apps Market
                </h3>
                <p className="text-gray-600 mb-4">
                  Growing at 21.5% CAGR, the education technology market represents 
                  enormous potential for innovative reading solutions.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Literature students seeking deeper understanding</li>
                  <li>• Classical literature enthusiasts</li>
                  <li>• Educators looking for teaching tools</li>
                  <li>• Lifelong learners exploring complex texts</li>
                </ul>
              </div>
              <div className="bg-primary-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-primary-700 mb-3">
                  Target Metrics
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users by Month 6:</span>
                    <span className="font-semibold text-primary-600">5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free-to-Paid Conversion:</span>
                    <span className="font-semibold text-primary-600">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Retention:</span>
                    <span className="font-semibold text-primary-600">70%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Technology & Architecture
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary-600 mb-3">
                  🎨 Frontend
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Next.js 14</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>Responsive Design</li>
                </ul>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary-600 mb-3">
                  ⚡ Backend
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Node.js/Express</li>
                  <li>Python/FastAPI</li>
                  <li>PostgreSQL + pgvector</li>
                  <li>Prisma ORM</li>
                </ul>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary-600 mb-3">
                  🤖 AI Integration
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>LangChain</li>
                  <li>OpenAI/Anthropic</li>
                  <li>Vector Embeddings</li>
                  <li>Semantic Search</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Development Progress */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Development Progress
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Phase 1: Foundation Setup</span>
                  <span>Month 1 of 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary-500 h-3 rounded-full w-3/12"></div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ Completed</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Next.js + TypeScript setup</li>
                    <li>• Database schema design</li>
                    <li>• Deployment pipeline</li>
                    <li>• Project documentation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">🚧 In Progress</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Authentication system</li>
                    <li>• EPUB processing</li>
                    <li>• AI integration</li>
                    <li>• Reading interface</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 text-white text-center">
            <h2 className="text-3xl font-semibold mb-4">
              Our Vision
            </h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              To become the definitive AI reading companion that makes classical literature 
              accessible, engaging, and enjoyable for readers worldwide. We envision a future 
              where complex texts become gateways to deeper understanding rather than barriers 
              to literary exploration.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}