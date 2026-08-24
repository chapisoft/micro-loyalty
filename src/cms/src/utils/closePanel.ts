const closePanel = () => {
  document.querySelectorAll('.p-dropdown-panel').forEach((panel) => {
    if (!panel.contains(document.activeElement)) {
      panel.classList.add('hidden');
    }
  });
  document.querySelectorAll('.p-multiselect-panel').forEach((panel) => {
    if (!panel.contains(document.activeElement)) {
      panel.classList.add('hidden');
    }
  });
};

export default closePanel;
