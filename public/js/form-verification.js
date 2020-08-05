// Script to add form verification to html forms
// Form must have form-validation="true" and a unique id
// Each input must have form-validation="true" and form-validation-type="type"
// type can be number, name, email, phone, notes, password, date
// Submit button must have class form-validate

$(() => {
  // Clear messages and print current message
  function printMessage(selector, valid) {
    const id = selector.attr('id');

    if (!valid) {
      // $('#' + id + '_msg').show();
      $(`#${id}`).removeClass('is-valid');
      $(`#${id}`).addClass('is-invalid');
    } else {
      // $('#' + id + '_msg').hide();
      $(`#${id}`).removeClass('is-invalid');
      $(`#${id}`).addClass('is-valid');
    }
  }

  function hideAllMessages() {
    $('.form-validation-invalid').each(function callback() {
      $(this).hide();
    });
  }

  // Function to validate input
  function validateInput(selector) {
    const value = selector.val();
    const validationType = selector.attr('form-validation-type');
    let valid = true;

    // Check that something has been entered
    if (value.length > 0) {
      // Check for valid number
      if (validationType === 'number') {
        const re = /[^0-9]/;
        valid = !re.test(value);

        // Check for valid name
      } else if (validationType === 'name') {
        const re = /[^a-zA-ZåäöÅÄÖ -]/;
        valid = !re.test(value);

        // Check for valid e-mail address
      } else if (validationType === 'email') {
        // Ensure @ followed by .
        const emailSplit = value.split('@');
        if (emailSplit.length < 2) {
          valid = false;
        } else {
          const domainSplit = emailSplit[emailSplit.length - 1].split('.');
          if (domainSplit.length < 2) {
            valid = false;
          } else {
            const re = /[^a-zA-Z0-9-]/;
            valid = !re.test(domainSplit[0]);
          }
        }

        // Check for valid phone number
      } else if (validationType === 'phone') {
        const phoneNumber = value.replace(/-/g, '').replace(/ /g, '');
        if (phoneNumber.charAt(0) !== '0' || phoneNumber.length < 10) {
          valid = false;
        } else {
          const re = /[^0-9]/;
          valid = !re.test(phoneNumber);
        }

        // Check that notes is not empty
      } else if (validationType === 'notes') {
        valid = true;

        // Check that password is not empty
      } else if (validationType === 'password') {
        valid = true;

        // Check that date is not empty
      } else if (validationType === 'date') {
        const date = value.split('-');
        if (date.length !== 3) {
          valid = false;
        } else {
          const year = parseInt(date[0], 10);
          const month = parseInt(date[1], 10);
          const day = parseInt(date[2], 10);
          if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31) {
            valid = false;
          } else {
            const re = /[^0-9-]/;
            valid = !re.test(value);
          }
        }

        // If invalid form-validation-type
      } else {
        valid = false;
      }

      // If no input
    } else {
      valid = false;
    }

    printMessage(selector, valid);
    return valid;
  }

  // What to do when submit button is clicked
  $('.form-validate').click(function callback() {
    const form = $(this).closest('form');
    if (form.attr('form-validation') === undefined || form.attr('form-validation') !== 'true') {
      // Do not validate
      return true;
    }

    // Validate
    let valid = true;
    $(`form#${form.attr('id')} :input`).each(function subcallback() {
      if ($(this).attr('form-validation') === 'true') {
        valid = validateInput($(this)) && valid;
      }
    });
    if (valid) {
      return true;
    }
    return false;
  });
});
