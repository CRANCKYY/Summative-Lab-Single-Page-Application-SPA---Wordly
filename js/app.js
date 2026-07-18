//STORAGE
const STORAGE_KEY = 'wordly_favs';
function getStore(){
    return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')
}
function setStore(items) {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
}
//VIEWS
function showView(view) {
    document.getElementById('home').style.display = view === 'home'? 'block' : 'none';
    document.getElementById('favourites').style.display = view === 'favourites' ? 'block': 'none';
    document.querySelectorAll('nav a').forEach(a=> a.classList.remove('active'));
    document.querySelector(`nav a[onclick*="${view}"]`).classList.add('active');


    if(view === 'favourites') showFavs();
}
//SEARCH
document.getElementById('searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const word = document.getElementById('wordInput').value.trim();
    if(!word) { showError('Please enter a word');return;}

    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('results').style.display = 'none';

    try{
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if(!res.ok)throw new Error('Word not found');
        const data = await res.json();
        showWord(data, word);
    } catch (err) {
        showError(err.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});
function showError(msg) {
    const el = document.getElementById('error');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('results').style.display = 'none';
}
//SHOW WORD
function showWord(data, word) {
    const entry = data[0];
    document.getElementById('wordTitle').textContent = word;

    const sound = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
    document.getElementById('phonetic').textContent = sound ? `/${sound}/` : '';


    const audio = entry.phonetics?.find(p => p.audio)?.audio;
    const audioBtn = document.getElementById('audioBtn');
    if(audio) {
        audioBtn.style.display = 'inline-block';
        audioBtn.onclick = () => new Audio(audio).play();
    } else {
        audioBtn.style.display = 'none';
    }
    
    const favBtn = document.getElementById('favBtn');
    const isSaved = getStore().some(f => f.toLowerCase() === word.toLowerCase());
    favBtn.textContent = isSaved ? 'Saved':'Save';
    favBtn.className = isSaved ? 'saved':'';
    favBtn.onclick = () => toggleSave(word);

    const meaningsDiv = document.getElementById('meanings');
    meaningsDiv.innerHTML ='';
    entry.meanings?.forEach(m => {
        const box = document.createElement('div');
        box.className = 'word-box';
        box.innerHTML = `<div class="pos">${m.partOfSpeech || ''}</div>`;
        m.definitions?.forEach(d => {
       box.innerHTML += `<div class="def">${d.definition || ''}</div>`;
       if (d.example) box.innerHTML += `<div class="ex">"${d.example}"</div>`;
});
        meaningsDiv.appendChild(box);
    });

    const synDiv = document.getElementById('synonyms');
    const allSyn = [];
    entry.meanings?.forEach(m => {
        m.definitions?.forEach(d => { if (d.synonyms) allSyn.push(...d.synonyms);});
        if(m.synonyms) allSyn.push(...m.synonyms);
    });
    const unique = [...new Set(allSyn)].filter(s => s);
    if (unique.length) {
        synDiv.innerHTML = '<h4>Synonyms:</h4>' + unique.map(s => `<span class="syn-tag">${s}</span>`).join('');
        } else {
            synDiv.innerHTML = '';
        }

        const sourceLink = document.getElementById('sourceLink');
        if(entry.sourceUrls?.length) {
            sourceLink.href = entry.sourceUrls[0];
            sourceLink.style.display = 'inline';
        } else {
            sourceLink.style.display = 'none';
        }
        document.getElementById('results').style.display = 'block';
}
//SAVE / UNSAVE
function toggleSave(word) {
    let items = getStore();
    const idx = items.findIndex(f => f.toLowerCase() === word.toLowerCase());
    idx > -1 ? items.splice(idx, 1) : items.push(word);
    setStore(items);

    const isSaved = items.some(f => f.toLowerCase() === word.toLowerCase());
    const btn = document.getElementById('favBtn');
    btn.textContent = isSaved ? 'Saved':'Save';
    btn.className = isSaved ? 'saved':'';

    showFavs();
}
function showFavs() {
    const items = getStore();
    document.getElementById('favCount').textContent = items.length + 'saved'

    const list = document.getElementById('favList');
    const empty = document.getElementById('favEmpty');
    
    //Create fav list if it does not exist
    if(!list) {
        const container = document.getElementById('favourites');
        const newList = document.createElement('div');
        newList.id = 'favList';
        container.insertBefore(newList, empty);
    }
    const favList = document.getElementById('favList');

    if(items.length === 0) {
        favList.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display ='none';
    favList.innerHTML = items.map(w => `
    <div class="fav-item">
        <span onclick="searchWord('${w}')">${w}</span>
        <button onclick="removeFav('${w}')">✕</button>
    </div>
`).join('')
}

function removeFav(word) {
    let items = getStore().filter(f => f.toLowerCase() !== word.toLowerCase());
        setStore(items);
        showFavs();
}
//SEARCH  FOR FAVOURITES
window.searchWord = function(word) {
    document.getElementById('wordInput').value = word;
    document.getElementById('searchForm').dispatchEvent(new Event('submit'));
    showView('home');
};

window.removeFav = removeFav;
window.showView = showView;
window.toggleSave = toggleSave;

//INIT
showView('home');
showFavs();