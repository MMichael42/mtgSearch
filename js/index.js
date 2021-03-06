// create custom namespace to prevent the global scope from getting polluted
let customNamespace = {}

customNamespace.nameSearchUrl = 'https://api.scryfall.com/cards/search?order=released&unique=prints&q=';
customNamespace.searchString = '';
customNamespace.previousSearchString = '';

customNamespace.cardContainer = document.getElementById('cardContainer');
customNamespace.inputField = document.getElementById('textInput');
customNamespace.setListContainer = document.getElementById('setList');
customNamespace.loadMoreCards = document.getElementById('loadMore');
customNamespace.slider = document.getElementById('rangeSlider');

customNamespace.sliderValues = [100, 200, 300, 400, 600];

function cardSearch(event) {
  customNamespace.searchString = customNamespace.inputField.value;

  if (event.key == 'Enter' && customNamespace.searchString.length > 0 && customNamespace.previousSearchString != customNamespace.searchString) {
    customNamespace.previousSearchString = customNamespace.searchString;
    customNamespace.searchString = customNamespace.searchString.split(' ').join('%20');
    // remove focus from text input so mobile keyboard hides
    customNamespace.inputField.blur();
    window.scrollTo(0, 0);
  
    searchMagic(customNamespace.searchString, customNamespace.nameSearchUrl);
  }
}

async function searchMagic(searchString, APIendpoint) {
  customNamespace.cardContainer.innerText = 'Loading...';
  customNamespace.loadMoreCards.innerHTML = '';

  try {
    const result = await fetch(APIendpoint + searchString);
    const resultJSON = await result.json();
    customNamespace.cardContainer.innerHTML = '';

    if (resultJSON.code == 'not_found') {
      customNamespace.cardContainer.innerText = 'no cards found';
      throw Error(resultJSON.details);
    }
    if (searchString != customNamespace.inputField.value.split(' ').join('%20')) {
      // clear out whatever cards have returned in the meantime
      customNamespace.cardContainer.innerHTML = '';
      throw Error('search string doesn\'t match input field');
    }

    buildCardList(resultJSON);
  } 
  catch(error) {
    console.log(error);
  }
}

function buildCardList(json) {
  customNamespace.cardContainer.innerHTML = '';
  customNamespace.slider.style.display = 'block';

  json.data.forEach(card => {
    // this returns HTMLCollection
    const elements = getCardHTML(card); 

    for (let ele of elements) {
      ele.style.maxWidth = customNamespace.sliderValues[customNamespace.slider.value] + 'px'; 
      customNamespace.cardContainer.appendChild(ele);
    }
  });

  if (json.has_more) {
    customNamespace.loadMoreCards.innerHTML = createLoadMoreButton(json);
  } else {
    customNamespace.loadMoreCards.innerHTML = '';
  }
}

function getCardHTML(cardData) {
  let eleArr = [];
  let cardHTML = '';
  

  // checks if the current card has multiple faces, loop through them if it does
  if (cardData.image_uris === undefined && cardData.card_faces !== undefined) {
    
    cardData.card_faces.forEach( card => {
      // use card id to avoid name collisions involving different double sided cards that share an illustration
      const createdID = card.illustration_id + "-" + Date.now() + "-" + cardData.id; 
      cardHTML =
      `<div class="card">
          <div class="cardIMGContainer">
            <img class="cardIMG" id="${createdID}" src="images/magicback.png" />
          </div>
        </div>
      `

      // put the above text into a div so we can extract it as a dom element, making it easier to alter the properties
      let wrapper = document.createElement('div');
      wrapper.innerHTML = cardHTML;
      const ele = wrapper.firstElementChild;
      eleArr.push(ele);

      // use this image object to download the card image in the background before putting it on the page
      let downloadingImg = new Image();
      // store card info on the downloadImg object to use when the onload function is called
      downloadingImg.customData = {
        url: card.image_uris.normal,
        cardID: createdID
      }  
      downloadingImg.onload = function() {
        document.getElementById(this.customData.cardID).src = this.customData.url
      }
      downloadingImg.src = card.image_uris.normal;
    });
  } else { // get cards with only one face
    const createdID = cardData.id + Date.now();

    cardHTML = 
      `<div class="card">
        <div class="cardIMGContainer">
          <img class="cardIMG" id="${createdID}" src="images/magicback.png" />
        </div>
      </div>
    `

    // put the above text into a div so we can extract it as a dom element, making it easier to alter the properties
    let wrapper = document.createElement('div');
    wrapper.innerHTML = cardHTML;
    const ele = wrapper.firstElementChild;
    eleArr.push(ele);

    let downloadingImg = new Image();
    downloadingImg.customData = {
      url: cardData.image_uris.normal,
      cardID: createdID
    }
    downloadingImg.onload = function() {
      document.getElementById(this.customData.cardID).src = this.customData.url
    }
    downloadingImg.src = cardData.image_uris.normal;
  }

  // return the array of element(s)
  return eleArr; 
}

// change this to a event handler? add the function to the button after card load
function createLoadMoreButton(jsonData) {
  return `<button id="loadButton" onclick="loadMoreCardsFunc('${jsonData.next_page}')">load more cards</button>`
}

async function loadMoreCardsFunc(nextPageString) {
  let loadButton = document.getElementById('loadButton')
  loadButton.textContent = 'loading...';

  try {
    const nextPage = await fetch(nextPageString);
    const nextPageJSON = await nextPage.json();

    nextPageJSON.data.forEach( card => {
      // returns HTMLCollection
      const elements = getCardHTML(card); 
      for (let ele of elements) {
        // set this new element to the width as determined by the current slider position
        ele.style.maxWidth = customNamespace.sliderValues[customNamespace.slider.value] + 'px'; 
        customNamespace.cardContainer.appendChild(ele);
      }
    });

    if (nextPageJSON.has_more) {
      customNamespace.loadMoreCards.innerHTML = createLoadMoreButton(nextPageJSON);
    } else {
      customNamespace.loadMoreCards.innerHTML = '';
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
  customNamespace.inputField.value = '';
  customNamespace.loadMoreCards.innerHTML = '';
  customNamespace.cardContainer.innerHTML = "Loading...";
  window.scrollTo(0, 0);

  try {
    const setInfo = await fetch('https://api.scryfall.com/sets/' + setCode);
    const setInfoJSON = await setInfo.json();
    const setsJSON = await getSetJson(setInfoJSON.search_uri);

    if (setsJSON.status === 404) {
      throw new Error("404: Set failed to load from the server");
    } else {
      buildCardList(setsJSON);
    }
  } 
  catch(error) {
    console.log(error);
    customNamespace.cardContainer.innerText = error;
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

customNamespace.slider.oninput = function(event) {
  const cardDivs = document.querySelectorAll('.card');
  changeCardSize(cardDivs);
}

function changeCardSize(nodeList) {
  if (!nodeList) {
    console.log('empty node list!');
    customNamespace.slider.value = 2;
    return;
  }

  nodeList.forEach( card => {
    let sliderValue = parseInt(customNamespace.slider.value);

    switch (sliderValue) {
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

window.onload = async function(event) {
  // on window load, get set list to display
  let setList = '';
  let setYear = '';
  
  try {
    const setsArr = await getSetList();
    setsArr.forEach( set => {
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
    customNamespace.setListContainer.innerHTML = setList;
  }
  catch(error) {
    console.log(error)
    console.log('set error on window load');
  }
}

document.onkeypress = function(event) {
  if (event.key === 's' && customNamespace.inputField !== document.activeElement) {
    gotoSetList();
  }
  if (event.key == 'w' && customNamespace.inputField !== document.activeElement) {
    window.scrollTo(0, 0);
  }
}