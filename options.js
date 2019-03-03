// Saves options to chrome.storage
function save_options() {
    var color = document.getElementById('color').value;
    var brainblocks = document.getElementById('brainblocks').checked;
    chrome.storage.sync.set({
      favoriteColor: color,
      brainblocks: brainblocks
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  function restore_options() {
    chrome.storage.sync.get({
      favoriteColor: 'dark',
      brainblocks: false
    }, function(items) {
      document.getElementById('color').value = items.favoriteColor;
      document.getElementById('brainblocks').checked = items.brainblocks;
    });
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);