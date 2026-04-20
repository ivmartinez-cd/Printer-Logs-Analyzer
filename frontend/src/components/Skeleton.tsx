import '../styles/skeleton.css'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
}

export function Skeleton({ className = '', width, height, circle }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    ...(circle ? { borderRadius: '50%' } : {}),
  }

  return <div className={'skeleton ' + className} style={style} />
}
