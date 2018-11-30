import React from 'react'

const SvgLog = ({ title, ...props }) => (
  <svg {...props}>
    <title>{title}</title>
    <path d="M10.5 8a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1h-6zM17 10.5a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1 0-1h6a.5.5 0 0 1 .5.5zM10 13.5a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 0-1h-6a.5.5 0 0 0-.5.5zM17 16.5a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1 0-1h6a.5.5 0 0 1 .5.5zM7 10.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zM7.5 8a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1h-1zM7 13.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zM9 16.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 .5.5z" />
  </svg>
)

export default SvgLog