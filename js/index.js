let nameSearchUrl = 'https://api.scryfall.com/cards/search?order=released&unique=prints&q=';

let cardContainer = document.getElementById('cardContainer');
let inputField = document.getElementById('input');
let setListContainer = document.getElementById('setList');
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
  window.scrollTo(0, 0);
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

      buildCardList(json);

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
            <img class="cardIMG" id="${card.id}" src="${card.image_uris.normal}" />
          </div>
        </div>
       `
    });
  } else {
    cardImg = cardData.image_uris.normal;
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

function getSetList() {
  return fetch('https://api.scryfall.com/sets')
    .then(res => {
      return res.json()
    })
    .then(json => {
      // console.log(json.data);
      return json.data.reverse();
    }).catch(err => {
      console.log(err);
    });
}

function loadSet(setCode) {
  console.log(setCode);
  window.scrollTo(0, 0);
  cardContainer.innerHTML = "Loading...";
  fetch('https://api.scryfall.com/sets/' + setCode)
    .then(res => {
      return res.json()
    })
    .then(json => {
      console.log(json);
      getSetJson(json.search_uri);
    })
}

function getSetJson(url) {
  fetch(url)
    .then(res => {
      return res.json();
    })
    .then(json => {
      buildCardList(json);
    });
}

function buildCardList(json) {
  cardContainer.innerHTML = '';

  json.data.forEach(card => {
    let ele = getCardHTML(card);
    cardContainer.innerHTML += ele;
  })

  if (json.has_more) {
    loadMoreCards.innerHTML = createLoadMoreButton(json);
  } else {
    loadMoreCards.innerHTML = '';
  }
}

window.onload = function(event) {
  console.log('hello world');
  getSetList().then( sets => {
    console.log(sets);
    let setList = '';
    let setYear = 0;
    sets.forEach( set => {
      currentSetYear = parseInt(set.released_at.substring(0, 4));

      if (currentSetYear !== setYear) {
        setList += `
          <div class ="year">${currentSetYear}</div>
          <button class="set" onclick="loadSet('${set.code}')">${set.name}<img class="setSymbol" src="${set.icon_svg_uri}" /></button>
        `
        setYear = currentSetYear;
      }

      setList += `
        <button class="set" onclick="loadSet('${set.code}')">${set.name}<img class="setSymbol" src="${set.icon_svg_uri}" /></button>
      `
    })
    setListContainer.innerHTML = setList;
  })
}

window.onscroll = function(event) {
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
    console.log('bottom of page!');
  }
}
