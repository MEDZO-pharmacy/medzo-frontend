export const validateSupplier = (values) => {
  const errors = {}
  if (!values.name?.trim()) errors.name = 'Supplier name is required.'
  else if (values.name.trim().length > 200) errors.name = 'Supplier name cannot exceed 200 characters.'
  if (!values.contactName?.trim()) errors.contactName = 'Contact person is required.'
  else if (values.contactName.trim().length > 150) errors.contactName = 'Contact person cannot exceed 150 characters.'

  const email = values.email?.trim()
  if (!email) errors.email = 'Email address is required.'
  else if (email.length > 254) errors.email = 'Email address cannot exceed 254 characters.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'

  const phone = values.phone?.trim()
  if (!phone) errors.phone = 'Phone number is required.'
  else if (phone.length > 30) errors.phone = 'Phone number cannot exceed 30 characters.'
  else {
    const digitCount = (phone.match(/\d/g) || []).length
    if (!/^[0-9+()\-\s]+$/.test(phone) || digitCount !== 10) errors.phone = 'Enter a valid 10-digit phone number.'
  }

  if (values.address?.trim().length > 500) errors.address = 'Business address cannot exceed 500 characters.'
  return errors
}
