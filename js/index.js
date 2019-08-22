let nameSearchUrl = 'https://api.scryfall.com/cards/search?order=released&unique=prints&q=';

let cardContainer = document.getElementById('cardContainer');
let inputField = document.getElementById('input');
let setListContainer = document.getElementById('setList');
let loadMoreCards = document.getElementById('loadMore');
let downArrow = document.getElementById('arrow');

let searchString = '';
let previousSearchString = '';
let moreCards = false;


function cardSearch(event) {
  searchString = inputField.value;

  if (event.key == 'Enter' && searchString.length > 0 && previousSearchString != searchString) {
    previousSearchString = searchString;
    searchString = searchString.split(' ').join('%20');
    window.scrollTo(0, 0);
    searchMagic(searchString, nameSearchUrl);
  }
}

async function searchMagic(searchString, APIendpoint) {
  cardContainer.innerText = 'Loading...';
  loadMoreCards.innerHTML = '';

  try {
    const result = await fetch(APIendpoint + searchString);
    const resultJSON = await result.json();
    cardContainer.innerHTML = '';

    if (resultJSON.code == 'not_found') {
      cardContainer.innerText = 'no cards found';
      throw Error(resultJSON.details);
    }

    if (searchString != inputField.value.split(' ').join('%20')) {
      throw Error('search string doesn\'t match input field');
    }

    buildCardList(resultJSON);

  } catch(error) {
    console.log(error);
  }
}

function buildCardList(json) {
  cardContainer.innerHTML = '';
  let cardArr = json.data;

  cardArr.forEach(card => {
    let ele = getCardHTML(card);
    cardContainer.innerHTML += ele;
  });

  if (json.has_more) {
    loadMoreCards.innerHTML = createLoadMoreButton(json);
  } else {
    loadMoreCards.innerHTML = '';
  }
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

function createLoadMoreButton(jsonData) {
  return `<button id="loadButton" onclick="loadMoreCardsFunc('${jsonData.next_page}')">Load more cards</button>`
}

async function loadMoreCardsFunc(nextPageString) {
  let currentCardContainer = document.getElementById('cardContainer');
  document.getElementById('loadButton').value = 'loading...';

  try {
    const nextPage = await fetch(nextPageString);
    const nextPageJSON = await nextPage.json();
    nextPageJSON.data.forEach( card => {
      const ele = getCardHTML(card);
      currentCardContainer.innerHTML += ele;
    });
    if (nextPageJSON.has_more) {
      loadMoreCards.innerHTML = createLoadMoreButton(nextPageJSON);
    } else {
      loadMoreCards.innerHTML = '';
    }
  } catch(error) {
    console.log(error);
  }
}

async function getSetList() {
  try {
    const sets = await fetch('https://api.scryfall.com/sets');
    const setsJSON = await sets.json();
    return setsJSON.data;
  } catch(error) {
    console.log(error);
  }
}

async function loadSet(setCode) {
  // clear the input and card div, then scroll back up to top
  inputField.value = '';
  loadMoreCards.innerHTML = '';
  cardContainer.innerHTML = "Loading...";
  window.scrollTo(0, 0);

  try {
    const setInfo = await fetch('https://api.scryfall.com/sets/' + setCode);
    const setInfoJSON = await setInfo.json();
    const setsJSON = await getSetJson(setInfoJSON.search_uri);
    buildCardList(setsJSON);
  } catch(error) {
    console.log(error);
  }
}

async function getSetJson(url) {
  try {
    const set = await fetch(url);
    const setJSON = await set.json();
    return setJSON;
  } catch(error) {
    console.log(error)
  }
}

function gotoSetList() {
  let spacer = document.getElementById('spacer');
  spacer.style.display = 'block';
  spacer.scrollIntoView();
}

window.onload = function(event) {
  // on window load, get set list to display
  getSetList().then( sets => {
    let setList = '';
    let setYear = 0;

    sets.forEach( set => {
      let currentSetYear = parseInt(set.released_at.substring(0, 4));

      if (currentSetYear !== setYear) {
        setList += `
          <div class ="year">${currentSetYear}</div>
          <button class="set" onclick="loadSet('${set.code}')">${set.name}<img class="setSymbol" src="${set.icon_svg_uri}" /></button>
        `
        setYear = currentSetYear;
      } else {
        setList += `
          <button class="set" onclick="loadSet('${set.code}')">${set.name}<img class="setSymbol" src="${set.icon_svg_uri}" /></button>
        `
      }
    });
    setListContainer.innerHTML = setList;
  })
}

document.onkeypress = function(event) {
  if (event.key === 's' && inputField !== document.activeElement) {
    gotoSetList();
  }
  if (event.key == 'w' && inputField !== document.activeElement) {
    window.scrollTo(0, 0);
  }
}