export async function analyzeFoodImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/functions/v1/analyze-food', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Food analysis request failed')
  }

  return response.json()
}
