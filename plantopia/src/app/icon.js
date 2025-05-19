import { ImageResponse } from 'next/og'

// Ruta a la imagen .png estática
export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

// Imagen generada
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00A651',
          borderRadius: '50%',
        }}
      >
        P
      </div>
    ),
    {
      ...size,
    }
  )
}
