export const formImages = (data: Record<string, any>): FormData => {
  const uploadKeys = ['Images', 'Photo'];

  return Object.keys(data).reduce((form, key) => {
    if (data[key] !== null && typeof data[key] !== 'undefined') {
      if (uploadKeys.includes(key) && Array.isArray(data[key]) && data[key].length > 0) {
        data[key].forEach((el: File | Blob) => {
          form.append(key, el);
        });
      } else {
        form.append(key, data[key]);
      }
    }
    return form;
  }, new FormData());
};
