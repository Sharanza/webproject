// grab elements on the page - in the DOM. store as variables
const formAddEl = document.getElementById('form-add');
const formViewEl = document.getElementById('form-view');
const formUpdateEl = document.getElementById('form-update');
const formDeleteEl = document.getElementById('form-delete');
const gamesListEl = document.querySelector('.games-list');
const commentsAddInputEl = document.getElementById('commentsAdd');
const commentsUpdateInputEl = document.getElementById('commentsUpdate');

// event handler function
// function created for character counter in comments section individualises add and update
function charCount(event) {
    // get the element that has been typed into
    // this is the element that the event listener was triggered on
    const inputEl = event.target;
    // get the value of the input
    const value = inputEl.value;
    // get the length of the value - how many characters have been inputted
    const characterCount = value.length;

    // get the data attribute of data-counter-el-id 
    const counterElId = inputEl.dataset.counterElId;
    // try and get the element on the page based on the data atrribute value
    const counterEl = document.getElementById(counterElId);
    // if there is an element found set its html to be the character count
    if (counterEl) {
        counterEl.innerHTML = characterCount;
    }
}

// event handler function
// when form is submitted this function will be called
async function handleFormSubmit(event) {
    // stop the default action which posts to a separate page
    event.preventDefault();

    // grab the form element that was submitted
    const formEl = event.target;

    // store all of the current form data that has been inputted using FormData API
    // https://developer.mozilla.org/en-US/docs/Web/API/FormData
    const formData = new FormData(formEl);

    // set a base form response to return from this function
    let formResponse = {
        success: true,
        message: '',
    };

    // try catch to attempt to submit and handle errors properly
    try {
        // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
        // use fetch api to post the data to the forms action url
        // data is sent in the body of the request to be used on req.body on server
        const response = await fetch(formEl.action, {
            method: 'POST',
            body: new URLSearchParams([...formData]),
        });

        // if the response gives a status code above 400 something went wrong
        // set the or return data to be unsuccessful
        if(response.status >= 400) {
            formResponse.success = false;
        }
        // get the message from the server that will be a string
        const responseMessage = await response.text();

        // set the return data of this function to be the response message
        formResponse.message = responseMessage;

        // clear the form if the form submission is successful
        if(formResponse.success) {
            formEl.reset();
        }
    } catch (err) {
        // set the return data for this function to unsuccessful if there was an error in any of the try code
        formResponse.message = err.message;
        formResponse.success = false;
    }
    // return the data
    return formResponse;
}

// function to display response message on the page to the user after they submit a form
function displayFormMessage(formEl, formResponse) {
    // try and get the form message element within the form that has been passed in to the function
    let messageEl = formEl.querySelector('.form-message');
    // if the form message element doesn't exist then create the element
    if(!messageEl) {
        messageEl = document.createElement('div');
        // add the class to the created div
        messageEl.classList.add('form-message');
    }
    // clear off any previous success and failure classes to just have original 'form-message' class
    messageEl.classList.remove("form-message--success", "form-message--error");
    // add success or failure classes to the form message div depending on whether the form response was successful
    messageEl.classList.add(formResponse.success ? 'form-message--success' : 'form-message--error');

    // set the content of the form message div to be form response message
    messageEl.innerHTML = `<p>${formResponse.message}</p>`;

    // try and get the last fieldset from the form
    const fieldsetEl = formEl.querySelector("fieldset:last-child");

    // if the fieldset element exists then insert the form message there
    if (fieldsetEl) {
        fieldsetEl.insertAdjacentElement('beforeend', messageEl);
    } else {
        // otherwise insert the message at the end of the form
        formAddEl.insertAdjacentElement('beforeend', messageEl);
    }
}

// event handler
// when form is submitted this function will be called
async function handleSubmitAndDisplayMessage(event) {
    // POST the form to the server and get the response back 
    const responseMessage = await handleFormSubmit(event);
    // display the form message on the page to the user after we have the response
    displayFormMessage(event.target, responseMessage);
    // display all of the games as they might have changed due to changes in the database
    displayAllGames();
}

// function to get all of the games back from the server
async function fetchAllGames() {
    // fetch the data from the /get-all route
    const allGamesResponse = await fetch('/get-all');
    // parse the response as JSON
    const allGames = await allGamesResponse.json();

    // if the response was unsuccessful return null/nothing
    if(!allGames.success) {
        return null;
    }
    // return the games property which is an array of games
    return allGames.games;
}

// function to show the games on the page to the user
// this will be called on page load and whenever a form is submitted
async function displayAllGames() {
    // wait for the fetch all games
    const allGames = await fetchAllGames();

    // if there was a response then loop over each game and create a list item with the data to display 
    const gamesMarkup = allGames ? allGames.map(game => {
        return `
            <li>
                Name: <strong>${game.name}</strong>,<br>
                Author: <strong>${game.author}</strong>,<br>
                Rating: <strong>${game.rating}</strong>,<br>
                Comments: <strong>${game.comments}</strong>
            </li>
        `;
    }).join('') // join each item together into one string
    : '';

    // set the list element markup to be our new games markup
    gamesListEl.innerHTML = gamesMarkup;
}

// add event listeners that will trigger when the forms are submitted
// they will call the handleSubmitAndDisplayMessage function when triggered
formAddEl.addEventListener('submit', handleSubmitAndDisplayMessage);
formViewEl.addEventListener('submit', handleSubmitAndDisplayMessage);
formUpdateEl.addEventListener('submit',handleSubmitAndDisplayMessage);
formDeleteEl.addEventListener('submit', handleSubmitAndDisplayMessage);

// listen to the keyup event on both comment boxes on the page
// when the events are triggered call the charCount function above
commentsAddInputEl.addEventListener('keyup', charCount);
commentsUpdateInputEl.addEventListener('keyup', charCount);

// call the function on page load to get all of the games and display them
displayAllGames();
