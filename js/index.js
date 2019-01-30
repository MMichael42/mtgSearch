let nameSearchUrl = 'https://api.scryfall.com/cards/search?order=released&unique=prints&q=';

let cardContainer = document.getElementById('cardContainer');
let inputField = document.getElementById('input');
let loadMoreCards = document.getElementById('loadMore');

let searchString = '';
let previousSearchString = '';
let moreCards = false;



function cardSearch(event) {
  console.log(event.key);
  searchString = document.getElementById('input').value;

  if (event.key == 'Enter' && searchString.length > 0 && previousSearchString != searchString) {
    previousSearchString = searchString;
    searchString = searchString.split(' ').join('%20');
    searchMagic(searchString, nameSearchUrl);
  }
}

function searchMagic(searchString, APIendpoint) {
  
  console.log(searchString);
  cardContainer.innerText = 'Loading...';
  loadMoreCards.innerHTML = '';
  fetch(APIendpoint + searchString)
    .then(res => {
      if (searchString != inputField.value.split(' ').join('%20')) {
        // console.log('abort this finishing fetch operation! Input field has changed!')
        cardContainer.innerHTML = '';
        throw 'Error: the inputfield text changed while the fetch request was out, but before it returned';
      } else {
        cardContainer.innerHTML = '';
        loadMoreCards.innerHTML = '';
        cardContainer.innerText = 'Loading...';
        return res.json();
      }
    })
    .then(json => {
      console.log(APIendpoint + searchString);
      console.log(json);
      cardContainer.innerHTML = '';

      if (json.code == 'not_found') {
        cardContainer.innerText = 'no cards found'
        throw Error(json.details);
        // return;
      }

      if (searchString != inputField.value.split(' ').join('%20')) {
        console.log("doesnt match!");
      }
      
      console.log('card loop...');
      console.log('searchString = ' + searchString);
      console.log('currentInput = ' + inputField.value.split(' ').join('%20'));
      json.data.forEach(card => {
        let ele = getCardHTML(card);
        cardContainer.innerHTML += ele;
      })

      if (json.has_more) {
        loadMoreCards.innerHTML = createLoadMoreButton(json);
      } else {
        loadMoreCards.innerHTML = '';
      }
    }).catch(err => {
      console.log(err);
    });
}

function getCardHTML(cardData) {
  let cardImg;
  let cardHTML = '';
  // the below code accounts for cards that may have more than one face
  if (cardData.image_uris == undefined && cardData.card_faces != undefined) {
    cardData.card_faces.forEach(card => {
      // console.log(card);
      cardHTML +=
       `<div class="card">
          <div class="cardIMGContainer">
            <img class="cardIMG" id="${card.id}" src="${card.image_uris.png}" />
          </div>
        </div>
       `
    });
  } else {
    cardImg = cardData.image_uris.png;
    cardHTML = 
      `<div class="card">
        <div class="cardIMGContainer">
          <img class="cardIMG" id="${cardData.id}" src="${cardImg}" />
        </div>
      </div>
      `
  }
  
  return cardHTML;
}

function loadMoreCardsFunc(nextPageString) {
  console.log('more cards load! : ' + nextPageString);
  let currentCardContainer = document.getElementById('cardContainer');

  document.getElementById('loadButton').value = 'loading...';

  fetch(nextPageString)
    .then(res => {
      return res.json();
    })
    .then(json => {
      console.log(json);
      json.data.forEach(card => {
        let ele = getCardHTML(card);
        currentCardContainer.innerHTML += ele;
      });
      if (json.has_more) {
        loadMoreCards.innerHTML = createLoadMoreButton(json);
      } else {
        loadMoreCards.innerHTML = '';
      }
    }); 
}

function createLoadMoreButton(jsonData) {
  return `<button id="loadButton" onclick="loadMoreCardsFunc('${jsonData.next_page}')">Load more cards</button>`
}

window.onscroll = function(event) {
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
    console.log('bottom of page!');
  }
}