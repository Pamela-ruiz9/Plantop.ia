import { ImageResponse } from 'next/og'

// Ruta a la imagen .png estática
export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

// Imagen generada
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
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
