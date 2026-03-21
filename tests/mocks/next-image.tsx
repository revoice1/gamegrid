import type { ImgHTMLAttributes } from 'react'

export default function NextImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} alt={props.alt ?? ''} />
}
