export const validateMedicine = (values) => {
  const errors = {}
  if (!values.name?.trim()) errors.name = 'Medicine name is required.'
  else if (values.name.trim().length > 200) errors.name = 'Medicine name cannot exceed 200 characters.'
  if (!values.genericName?.trim()) errors.genericName = 'Generic name is required.'
  else if (values.genericName.trim().length > 200) errors.genericName = 'Generic name cannot exceed 200 characters.'
  if (!values.manufacturer?.trim()) errors.manufacturer = 'Manufacturer is required.'
  else if (values.manufacturer.trim().length > 200) errors.manufacturer = 'Manufacturer cannot exceed 200 characters.'
  if (values.unitPrice === '' || values.unitPrice === null || values.unitPrice === undefined) errors.unitPrice = 'Unit price is required.'
  else if (!Number.isFinite(Number(values.unitPrice)) || Number(values.unitPrice) < 0) errors.unitPrice = 'Unit price must be zero or greater.'
  if (values.reorderThreshold === '' || values.reorderThreshold === null || values.reorderThreshold === undefined) errors.reorderThreshold = 'Reorder threshold is required.'
  else if (!Number.isInteger(Number(values.reorderThreshold)) || Number(values.reorderThreshold) < 0) errors.reorderThreshold = 'Reorder threshold must be a whole number of zero or greater.'
  return errors
}
