import { API_URL } from '@/lib/config'

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean>
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { params, headers, ...fetchOptions } = options

  const url = new URL(`${API_URL}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  })

  const contentType = response.headers.get('content-type')
  const data = contentType?.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    // Backend errors come back as plain strings or as { error } / { msg } objects.
    const message =
      typeof data === 'string' && data
        ? data
        : typeof data === 'object' && data !== null
          ? String(
              'error' in data
                ? data.error
                : 'msg' in data
                  ? data.msg
                  : `Request failed with status ${response.status}`,
            )
          : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data as T
}
