const baseUrl = `${window.location.origin}${window.location.pathname}`;

function lookupSwishErrorMessage(message) {
  switch (message) {
    case 'FF08':
      return 'PaymentReference is invalid.';

    case 'RP03':
      return 'Callback URL is missing or does not use HTTPS.';

    case 'PA02':
      return 'Amount value is missing or not a valid number.';

    case 'AM03':
      return 'Invalid or missing Currency.';

    case 'AM04':
      return 'Insufficient funds in account.';

    case 'AM06':
      return 'Specified transaction amount is less than agreed minimum.';

    case 'RP01':
      return 'Missing Merchant Swish Number.';

    case 'RP02':
      return 'Wrong formatted message.';

    case 'ACMT07':
      return 'Payee not Enrolled.';

    case 'ACMT01':
      return 'Counterpart is not activated.';

    case 'RF02':
      return 'Original Payment not found or original payment is more than 13 months old.';

    case 'RF03':
      return 'Payer alias in the refund does not match the payee alias in the original payment.';

    case 'RF04':
      return 'Payer organization number do not match original payment payee organization number.';

    case 'RF06':
      return 'The Payer SSN in the original payment is not the same as the SSN for the current Payee. Note: Typically, this means that the Mobile number has been transferred to another person.';

    case 'RF07':
      return 'Transaction declined.';

    case 'RF08':
      return 'Amount value is too large, or amount exceeds the amount of the original payment minus any previous refunds. Note: the remaining available amount is put into the additional information field.';

    case 'RF09':
      return 'Refund already in progress.';

    case 'RP09':
      return 'InstructionUUID not available.';

    case 'FF10':
      return 'Bank system processing error.';

    case 'BE18':
      return 'Payer alias is invalid.';

    default:
      return '';
  }
}

function markAsPaid(e) {
  e.preventDefault();

  const id = $(this).attr('class').split('-')[1];
  const url = `${baseUrl}/markaspaid/${id}`;
  $.ajax({
    method: 'get',
    url
  }).done((data) => {
    if (data.status === 'OK') {
      $(`.statusicon-${id}`).attr('src', '/icons/paid.svg').attr('alt', 'Paid!');
      $(`.status-${id}`).text('Paid');
      $(`.markaspaid-${id}`).remove();
    }
  }).catch((error) => {
    console.log(error);
  });
}

function markAsInvoiced(e) {
  e.preventDefault();

  const id = $(this).attr('class').split('-')[1];
  const url = `${baseUrl}/markasinvoiced/${id}`;
  $.ajax({
    method: 'get',
    url
  }).done((data) => {
    if (data.status === 'OK') {
      $(`.statusicon-${id}`).attr('src', '/icons/invoice.svg').attr('alt', 'Invoiced');
      $(`.status-${id}`).text('Invoiced');
      $(`<a href="#" class="markaspaid-${id}">(Mark as Paid)</a>`).click(markAsPaid).insertAfter($('a[class^=\'markasinvoiced-\']'));
      $(`.markasinvoiced-${id}`).remove();
    }
  }).catch((error) => {
    console.log(error);
  });
}

function cancelOrder() {
  const id = $(this).val();
  const url = `${baseUrl}/cancel/${id}`;
  $.ajax({
    method: 'get',
    url
  }).done((data) => {
    if (data.status === 'OK') {
      $(`tr[id^=row-${id}`).addClass('table-danger');
      $(`.statusicon-${id}`).attr('src', '/icons/cancelled.svg').attr('alt', 'Cancelled');
      $(`.status-${id}`).text('Cancelled');
      $(`.markaspaid-${id}`).remove();
      $(`.markasinvoiced-${id}`).remove();
    }
  }).catch((error) => {
    console.log(error);
  });
}

function updateSMS() {
  const recipientCode = $(this).val();
  const message = $(`#smstext-${recipientCode}`).val();
  const url = `${baseUrl}/updateSMS/${recipientCode}`;
  $.ajax({
    method: 'post',
    url,
    data: {
      message
    }
  }).done((data) => {
    if (data.status === 'OK') {
      $(`#smslink-${recipientCode}`).attr('href', data.link);
      $(`#smsedit-${recipientCode}`).modal('hide');
    }
  }).catch((error) => {
    console.log(error);
  });
}

function getSMS() {
  const [, id, recipientNumber] = $(this).attr('id').split('-');
  const url = `${baseUrl}/getSMS/${id}-${recipientNumber}`;
  $.ajax({
    method: 'get',
    url
  }).done((data) => {
    if (data.status === 'OK') {
      $(`#smstext-${id}-${recipientNumber}`).val(data.message);
    }
  }).catch((error) => {
    console.log(error);
  });
}

function moveUp(e) {
  e.preventDefault();
  e.stopPropagation();

  const htmlId = $(this).attr('id');
  const [, year, week,, id, recipientNumber] = htmlId.split('-');

  if ($(this).hasClass('unmoveable')) {
    return false;
  }

  let prevId = '';
  $(`a[id^=moveup-${year}-${week}-`).each(function callback() {
    if ($(this).attr('id') === htmlId) {
      return false;
    }
    prevId = $(this).attr('id');
    return true;
  });

  if (prevId === '') {
    return;
  }

  const [,,,, previousId, previousRecipientNumber] = prevId.split('-');
  const url = `${baseUrl}/swapOrder/${id}-${recipientNumber}-${previousId}-${previousRecipientNumber}`;
  $.ajax({
    method: 'get',
    url
  }).done((data) => {
    $(`#row-${id}-${recipientNumber}`).hide().insertBefore(`#row-${previousId}-${previousRecipientNumber}`).show();
    $(`#inforow-${id}-${recipientNumber}`).hide().insertBefore(`#row-${previousId}-${previousRecipientNumber}`).show();
    if ($(`#${prevId}`).hasClass('unmoveable')) {
      $(`#${htmlId}`).addClass('unmoveable');
      $(`#${prevId}`).removeClass('unmoveable');
    }
  }).catch((error) => {
    console.log(error);
  });
}

function swishRefund() {
  const id = $(this).attr('id').split('-')[1];
  const amount = parseInt($(`#swishrefundamount-${id}`).val(), 10);
  const url = `${baseUrl}/swishrefund`;
  if (Number.isNaN(amount) || amount < 0) {
    return;
  }
  $(this).prop('disabled', true).text('Refunding...')
    .prepend(`<span id="spinner-${id}" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;`);
  $.ajax({
    method: 'post',
    url,
    data: {
      id,
      amount
    }
  }).done((data) => {
    $(this).prop('disabled', false).text('Send');
    $(`#spinner-${id}`).remove();

    if (data.status === 'Paid') {
      $(`.refunderror-${id}`).empty();
      const html = `<li class="new-refund">${data.timestamp} - ${data.amount}</li>`;
      $(`#refunds-${id}`).append(html).show();
    } else if (data.status === 'Error') {
      for (let i = 0; i < data.error.length; i += 1) {
        $(`.refunderror-${id}`).append(`<li>${lookupSwishErrorMessage(data.error[i].defaultMessage)}</li>`);
      }
    }
  }).catch((error) => {
    console.log(error);
  });
}

$(() => {
  $('a[class^=markasinvoiced-]').click(markAsInvoiced);
  $('a[class^=markaspaid-]').click(markAsPaid);
  $('button[name=cancel]').click(cancelOrder);

  $('a[id^=moveup-').click(moveUp);
  $('.map-icon').click((e) => {
    e.stopPropagation();
  });

  $('.modal[id^=smsedit]').on('hidden.bs.modal', getSMS);
  $('button[name=update-sms]').click(updateSMS);

  $('button[id^=swishrefund-]').click(swishRefund);
});
