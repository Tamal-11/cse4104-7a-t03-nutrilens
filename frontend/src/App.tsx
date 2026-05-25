import { FoodUpload } from './components/FoodUpload'

function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-slate-900">NutriLens</h1>
        <p className="mt-3 text-slate-600">
          Upload a food image to identify the food and view estimated nutrition values,
          health benefits, and possible side effects.
        </p>
        <FoodUpload />
      </section>
    </main>
  )
}

export default App
