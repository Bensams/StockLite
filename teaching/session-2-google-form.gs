/**
 * Creates the Topic 2 session form (quiz + feedback + selfie section) in YOUR Google Drive.
 *
 * How to run:
 *   1. Go to https://script.google.com and click "New project".
 *   2. Delete the sample code, paste this whole file, and click Save.
 *   3. Choose createSessionForm in the toolbar and click Run. Approve the permission prompt (it only creates a form).
 *   4. Open View > Logs (or the Execution log) and copy the EDIT link and the SHARE link.
 *
 * One manual step afterwards (Apps Script cannot create file-upload questions):
 *   Open the EDIT link, go to the last section "Selfie in the comlab", click "+" (Add question),
 *   change the type to "File upload", then set: allow only Image, max 1 file, max 10 MB, Required on.
 *   Respondents must be signed in to Google to upload; photos are saved in a folder in your Drive.
 */
function createSessionForm() {
  const form = FormApp.create('Topic 2: Integration Testing — Quiz and Feedback');
  form.setDescription(
    'Peer Mentoring Group 5 · Topic 2: Application Integration, Debugging and Integration Testing · October 14, 2026\n\n' +
    'Part 1: about you. Part 2: a 5-question quiz. Part 3: 5 feedback questions. ' +
    'Part 4: a selfie in the computer laboratory for our attendance documentation.'
  );
  form.setIsQuiz(true);
  form.setProgressBar(true);
  form.setConfirmationMessage('Thank you for joining today\'s session! See you in Topic 3 on October 19.');

  // Part 1: about you
  form.addTextItem().setTitle('Full name').setRequired(true);
  form.addTextItem().setTitle('Section').setRequired(true);
  form.addTextItem().setTitle('Group name or mini-project title').setRequired(false);

  // Part 2: quiz (1 point each, auto-graded)
  form.addPageBreakItem()
    .setTitle('Part 2: Quick quiz')
    .setHelpText('Five questions about today\'s session. Choose the best answer.');

  addQuizQuestion(form,
    'The Stock In preview shows 105, but the Network response is 200 and the database shows 15. What type of defect is this?',
    ['UI defect', 'Database logic error', 'External service failure', 'Permission defect'],
    0,
    'Correct. The API and the database are right; only the calculation on the screen is wrong, so the fix belongs in the page.',
    'The API (200) and the database (15) are both right. Only the screen is wrong, which makes it a UI defect.');

  addQuizQuestion(form,
    'A request returns status 422 and its payload has "amount" instead of "quantity". What is the correct fix?',
    ['Make the server accept "amount" as well', 'Change the sender to use the field the API contract defines: "quantity"', 'Restart the database', 'Remove the validation from the API'],
    1,
    'Correct. The API contract is the agreement; the sender broke it, so the sender is fixed.',
    'This is an API contract mismatch. Fix the sender so it sends "quantity"; never loosen the server\'s validation.');

  addQuizQuestion(form,
    'What does a status code in the 5xx range (for example 503) tell you?',
    ['The request succeeded', 'The user must change the request', 'The server or a service it depends on failed', 'The user is not signed in'],
    2,
    'Correct. 5xx means the server or a service it depends on failed; retry and check the service.',
    '4xx means the request must change. 5xx means the server or a service it depends on failed.');

  addQuizQuestion(form,
    'You see a failed request in the Network tab. How do you find its matching line in the server log?',
    ['Read the newest line in the terminal', 'Copy the request_id from the response and search for it in the terminal', 'Read the first error in the Console', 'Reload the page and compare the times'],
    1,
    'Correct. The same request_id appears in the response body and in the server log line.',
    'Use the request_id: it is in the response body and in the matching server log line.');

  addQuizQuestion(form,
    'Stock Out of 13 when only 12 are on hand is rejected with 409 "Not enough stock." How should you record this test?',
    ['Passed: the system correctly rejected an invalid request', 'Failed: the app has a bug', 'Blocked: the test could not run', 'Skip it: errors are not tested'],
    0,
    'Correct. A 409 for a broken business rule is the system protecting the data, so the test passes.',
    'Rejecting an overdraw is correct behavior. Write "request rejected" as the expected result and mark it Passed.');

  // Part 3: feedback (not graded)
  form.addPageBreakItem()
    .setTitle('Part 3: Your feedback')
    .setHelpText('Help us improve. These questions are not graded.');

  form.addScaleItem()
    .setTitle('Overall, how would you rate today\'s session?')
    .setBounds(1, 5).setLabels('Poor', 'Excellent').setRequired(true);
  form.addScaleItem()
    .setTitle('The explanations were clear and easy to follow.')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree').setRequired(true);
  form.addScaleItem()
    .setTitle('I feel confident writing and running integration test cases for my capstone project.')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree').setRequired(true);

  const part = form.addMultipleChoiceItem().setTitle('Which part of the session helped you the most?').setRequired(true);
  part.setChoices([
    part.createChoice('Concepts discussion (status codes, debugging tools, defect types)'),
    part.createChoice('Live demonstration'),
    part.createChoice('Integration Test Challenge (hands-on)'),
    part.createChoice('Defect analysis'),
    part.createChoice('The learning module'),
  ]);

  form.addParagraphTextItem()
    .setTitle('What should we improve for future peer mentoring sessions?')
    .setRequired(false);

  // Part 4: selfie (add the File upload question here by hand; see the note at the top)
  form.addPageBreakItem()
    .setTitle('Part 4: Selfie in the comlab')
    .setHelpText('Upload one photo of yourself (or with your group) in the computer laboratory during today\'s session. ' +
      'It is used only as attendance evidence in our peer mentoring documentary report.');

  Logger.log('EDIT link (add the File upload question here): ' + form.getEditUrl());
  Logger.log('SHARE link (send this to the juniors): ' + form.getPublishedUrl());
}

function addQuizQuestion(form, title, choices, correctIndex, rightFeedback, wrongFeedback) {
  const item = form.addMultipleChoiceItem().setTitle(title).setPoints(1).setRequired(true);
  item.setChoices(choices.map((text, i) => item.createChoice(text, i === correctIndex)));
  item.setFeedbackForCorrect(FormApp.createFeedback().setText(rightFeedback).build());
  item.setFeedbackForIncorrect(FormApp.createFeedback().setText(wrongFeedback).build());
}
