export async function analyzeFoodImage(file: File, accessToken?: string) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  const formData = new FormData()
  formData.append('image', file)

  const uploadResponse = await fetch(`${apiBaseUrl}/api/v1/upload-food-image`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
    credentials: 'include',
  })

  if (!uploadResponse.ok) {
    throw new Error('Food image upload failed')
  }

  const uploadResult = await uploadResponse.json()

  const response = await fetch(`${apiBaseUrl}/api/v1/analyze-food`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ imageId: uploadResult.data.imageId }),
  })

  if (!response.ok) {
    throw new Error('Food analysis request failed')
  }

  return response.json()
}
