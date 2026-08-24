export const objectToFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] != null && typeof data[key] !== 'undefined') {
      if (Array.isArray(data[key])) {
        data[key].forEach((el) => {
          formData.append(key, el);
        });
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};
