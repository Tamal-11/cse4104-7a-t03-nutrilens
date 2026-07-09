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

  const uploadResult = await uploadResponse.json().catch(() => ({}))

  if (!uploadResponse.ok) {
    throw new Error(uploadResult.message || 'Food image upload failed')
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/analyze-food`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ imageId: uploadResult.data.imageId }),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.message || 'Food analysis request failed')
  }

  return result
}
