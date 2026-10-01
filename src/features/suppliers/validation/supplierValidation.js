export const validateSupplier = (values) => {
  const errors = {}
  if (!values.name?.trim()) errors.name = 'Supplier name is required.'
  else if (values.name.trim().length > 200) errors.name = 'Supplier name cannot exceed 200 characters.'
  if (!values.contactName?.trim()) errors.contactName = 'Contact name is required.'
  else if (values.contactName.trim().length > 150) errors.contactName = 'Contact name cannot exceed 150 characters.'
  if (!values.email?.trim()) errors.email = 'Email address is required.'
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.phone?.trim()) errors.phone = 'Phone number is required.'
  else if (values.phone.trim().length > 30) errors.phone = 'Phone number cannot exceed 30 characters.'
  if (values.address?.length > 500) errors.address = 'Address cannot exceed 500 characters.'
  return errors
}
