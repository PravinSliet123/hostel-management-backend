// Generate UID for users
export const generateUID = (id) => {
  // Prefix based on ID length
  const prefix = "HMS"

  // Pad ID with zeros
  const paddedId = id.toString().padStart(6, "0")

  return `${prefix}${paddedId}`
}
