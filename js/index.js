const nameSearchUrl = 'https://api.scryfall.com/cards/search?order=released&unique=prints&q=';

const cardContainer = document.getElementById('cardContainer');
const inputField = document.getElementById('textInput');
const setListContainer = document.getElementById('setList');
const loadMoreCards = document.getElementById('loadMore');
const slider = document.getElementById('rangeSlider');

let searchString = '';
let previousSearchString = '';
let moreCards = false;

const sliderValues = [100, 200, 300, 400, 600];
slider.style.display = 'none';


function cardSearch(event) {
  searchString = inputField.value;

  if (event.key == 'Enter' && searchString.length > 0 && previousSearchString != searchString) {
    previousSearchString = searchString;
    searchString = searchString.split(' ').join('%20');
    window.scrollTo(0, 0);
    console.log('search: ' + searchString);
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
      // clear out whatever cards have returned in the meantime
      cardContainer.innerHTML = '';
      throw Error('search string doesn\'t match input field');
    }

    buildCardList(resultJSON);
  } 
  catch(error) {
    console.log(error);
  }
}

function buildCardList(json) {
  cardContainer.innerHTML = '';
  slider.style.display = 'block';

  json.data.forEach(card => {
    const ele = getCardHTML(card);
    ele.style.maxWidth = sliderValues[slider.value] + 'px'; 
    cardContainer.appendChild(ele);
  });

  if (json.has_more) {
    loadMoreCards.innerHTML = createLoadMoreButton(json);
  } else {
    loadMoreCards.innerHTML = '';
  }
}

function getCardHTML(cardData) {
  let cardHTML = '';

  // checks if the current card has multiple faces, loop through them if it does
  if (cardData.image_uris == undefined && cardData.card_faces != undefined) {

    cardData.card_faces.forEach(card => {
      const createID = card.illustration_id + Date.now();
      cardHTML +=
      `<div class="card">
          <div class="cardIMGContainer">
            <img class="cardIMG" id="${createID}" src="images/magicback.png" />
          </div>
        </div>
      `

      // use this image object to download the card image in the background before putting it on the page
      let downloadingImg = new Image();
      // store card info on the downloadImg object to use when the onload function is called
      downloadingImg.customData = {
        url: card.image_uris.normal,
        cardID: createID
      }  
      downloadingImg.onload = function() {
        document.getElementById(this.customData.cardID).src = this.customData.url;
      }
      downloadingImg.src = card.image_uris.normal;
    });
  // get cards with only one face
  } else {
    const createID = cardData.id + Date.now();
    cardHTML = 
      `<div class="card">
        <div class="cardIMGContainer">
          <img class="cardIMG" id="${createID}" src="images/magicback.png" />
        </div>
      </div>
    `
    let downloadingImg = new Image();
    downloadingImg.customData = {
      url: cardData.image_uris.normal,
      cardID: createID
    }
    downloadingImg.onload = function() {
      document.getElementById(this.customData.cardID).src = this.customData.url
    }
    downloadingImg.src = cardData.image_uris.normal;
  }

  // convert this text to an actual DOM element before returning it;
  // create throwaway parent div
  let wrapper = document.createElement('div');
  // inseart that html plain text into the wrapper div
  wrapper.innerHTML = cardHTML;
  // extract the first child, now a real DOM node
  const cardElement = wrapper.firstChild;

  return cardElement;
}

// change this to a event handler? add the function to the button after card load
function createLoadMoreButton(jsonData) {
  return `<button id="loadButton" onclick="loadMoreCardsFunc('${jsonData.next_page}')">load more cards</button>`
}

async function loadMoreCardsFunc(nextPageString) {
  // let currentCardContainer = document.getElementById('cardContainer');
  let loadButton = document.getElementById('loadButton')
  loadButton.textContent = 'loading...';

  try {
    const nextPage = await fetch(nextPageString);
    const nextPageJSON = await nextPage.json();

    nextPageJSON.data.forEach( card => {
      const ele = getCardHTML(card);
      // set this new element to the width as determined by the current slider position
      ele.style.maxWidth = sliderValues[slider.value] + 'px'; 
      cardContainer.appendChild(ele);
    });

    if (nextPageJSON.has_more) {
      loadMoreCards.innerHTML = createLoadMoreButton(nextPageJSON);
    } else {
      loadMoreCards.innerHTML = '';
    }
  } 
  catch(error) {
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
  } 
  catch(error) {
    console.log(error);
  }
}

async function getSetJson(url) {
  try {
    const set = await fetch(url);
    const setJSON = await set.json();
    return setJSON;
  } 
  catch(error) {
    console.log(error)
  }
}

function gotoSetList() {
  let spacer = document.getElementById('spacer');
  spacer.style.display = 'block';
  spacer.scrollIntoView();
}

slider.oninput = function(event) {
  const cardDivs = document.querySelectorAll('.card');
  changeCardSize(cardDivs);
}

function changeCardSize(nodeList) {
  if (!nodeList) {
    console.log('empty node list!');
    slider.value = 2;
    return;
  }

  nodeList.forEach( card => {
    let val = parseInt(slider.value);

    switch (val) {
      case 0:
        card.style.maxWidth = "100px";
        card.style.margin = "5px";
        window.scrollTo(0,0);
        break;
      case 1:
        card.style.maxWidth = "200px";
        card.style.margin = "5px";
        window.scrollTo(0,0);
        break;
      case 2:
        card.style.maxWidth = "300px";
        card.style.margin = "5px";
        window.scrollTo(0,0);
        break;
      case 3:
        card.style.maxWidth = "400px";
        card.style.margin = "7px";
        break;
      case 4:
        card.style.maxWidth = "600px";
        card.style.margin = "7px";
        break;
      default:
        break;
    }
  });
}

function isInViewport(element) {
  const bounding = element.getBoundingClientRect();
    return (
      bounding.top >= 0 &&
      bounding.left >= 0 &&
      bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
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