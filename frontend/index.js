

const STORAGE_KEY = 'itec_produits';

function getProduits() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProduits(produits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produits));
}



const MARQUES_PAR_CATEGORIE = {
    'Smartphones': ['Apple', 'Samsung', 'Huawei'],
    'Ordinateurs': ['Acer', 'Dell', 'HP'],
    'Électroménagers': {
        'Aspirateurs': ['Dyson', 'Ninja', 'Cecotec'],
        'Réfrigérateurs': ['LG', 'Samsung', 'Beko'],
        'Machines à laver': ['Hisense', 'Beko', 'Samsung']
    }
};

const PREFIXE_CATEGORIE = {
    'Smartphones': 'SM',
    'Ordinateurs': 'PC',
    'Électroménagers': 'EM'
};

const MAX_PRODUITS_PAR_MARQUE = 5;

function getMarquesAutorisees(categorie, sousCategorie) {
    if (categorie === 'Électroménagers') {
        return MARQUES_PAR_CATEGORIE['Électroménagers'][sousCategorie] || [];
    }
    return MARQUES_PAR_CATEGORIE[categorie] || [];
}

function compterProduitsParMarque(categorie, sousCategorie, marque) {
    const produits = getProduits();
    return produits.filter(p =>
        p.categorie === categorie &&
        p.sousCategorie === (sousCategorie || null) &&
        p.marque === marque
    ).length;
}

function genererReference(categorie, marque, version) {
    const prefixe = PREFIXE_CATEGORIE[categorie] || 'XX';
    const marqueCode = marque.substring(0, 3).toUpperCase();
    const versionCode = version.substring(0, 3).toUpperCase();
    const produits = getProduits();
    const prefixeRef = `${prefixe}-${marqueCode}-${versionCode}-`;
    const refsExistantes = produits
        .filter(p => p.reference.startsWith(prefixeRef))
        .map(p => parseInt(p.reference.split('-')[3]) || 0);
    const prochainNumero = refsExistantes.length > 0
        ? Math.max(...refsExistantes) + 1
        : 1;
    return `${prefixeRef}${String(prochainNumero).padStart(3, '0')}`;
}



function ajouterProduit(produit) {
    const produits = getProduits();

    // Vérification 1 : Unicité de la référence
    if (produits.some(p => p.reference === produit.reference)) {
        return { success: false, message: `❌ La référence "${produit.reference}" existe déjà !` };
    }

    // Vérification 2 : Quantité entre 0 et 10
    if (produit.quantite < 0 || produit.quantite > 10) {
        return { success: false, message: '❌ La quantité doit être comprise entre 0 et 10.' };
    }

    // Vérification 3 : Cohérence marque/catégorie
    const marquesAutorisees = getMarquesAutorisees(produit.categorie, produit.sousCategorie);
    if (!marquesAutorisees.includes(produit.marque)) {
        return { success: false, message: `❌ La marque "${produit.marque}" n'est pas autorisée pour cette catégorie.` };
    }

    // Vérification 4 : Maximum 5 produits par marque
    const nombreProduits = compterProduitsParMarque(
        produit.categorie,
        produit.sousCategorie,
        produit.marque
    );
    if (nombreProduits >= MAX_PRODUITS_PAR_MARQUE) {
        return { success: false, message: `❌ La marque "${produit.marque}" a déjà ${MAX_PRODUITS_PAR_MARQUE} produits (maximum autorisé).` };
    }

    // Ajout du statut
    produit.statut = produit.quantite === 0 ? 'Rupture' : 'Disponible';

    // Ajout du produit
    produits.push(produit);
    saveProduits(produits);

    return { success: true, message: `✅ Produit "${produit.nom}" ajouté avec succès ! Référence : ${produit.reference}` };
}

function afficherMessage(texte, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = texte;
    messageDiv.className = `mt-4 p-4 rounded-lg font-semibold ${
        type === 'success'
            ? 'bg-green-100 text-green-800 border-2 border-green-300'
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}



const selectCategorie = document.getElementById('categorie');
const selectSousCategorie = document.getElementById('sousCategorie');
const selectMarque = document.getElementById('marque');
const divSousCategorie = document.getElementById('div-sous-categorie');

selectCategorie.addEventListener('change', function() {
    const categorie = this.value;
    if (categorie === 'Électroménagers') {
        divSousCategorie.classList.remove('hidden');
        selectSousCategorie.required = true;
    } else {
        divSousCategorie.classList.add('hidden');
        selectSousCategorie.required = false;
        selectSousCategorie.value = '';
    }
    mettreAJourMarques();
});

selectSousCategorie.addEventListener('change', mettreAJourMarques);

function mettreAJourMarques() {
    const categorie = selectCategorie.value;
    const sousCategorie = selectSousCategorie.value;
    selectMarque.innerHTML = '<option value="">-- Choisir --</option>';
    if (!categorie) return;
    const marques = getMarquesAutorisees(categorie, sousCategorie);
    marques.forEach(marque => {
        const option = document.createElement('option');
        option.value = marque;
        option.textContent = marque;
        selectMarque.appendChild(option);
    });
}


document.getElementById('form-ajout').addEventListener('submit', function(e) {
    e.preventDefault();

    const categorie = document.getElementById('categorie').value;
    const sousCategorie = document.getElementById('sousCategorie').value;
    const marque = document.getElementById('marque').value;
    const nom = document.getElementById('nom').value.trim();
    const version = document.getElementById('version').value.trim();
    const quantite = parseInt(document.getElementById('quantite').value);

    if (!categorie || !marque || !nom || !version || isNaN(quantite)) {
        afficherMessage('❌ Veuillez remplir tous les champs.', 'error');
        return;
    }

    if (categorie === 'Électroménagers' && !sousCategorie) {
        afficherMessage('❌ Veuillez choisir une sous-catégorie.', 'error');
        return;
    }

    const reference = genererReference(categorie, marque, version);

    const produit = {
        nom, marque, categorie,
        sousCategorie: categorie === 'Électroménagers' ? sousCategorie : null,
        version, reference, quantite
    };

    const resultat = ajouterProduit(produit);
    afficherMessage(resultat.message, resultat.success ? 'success' : 'error');

    if (resultat.success) {
        this.reset();
        divSousCategorie.classList.add('hidden');
        selectMarque.innerHTML = '<option value="">-- Choisir une catégorie d\'abord --</option>';
    }
});

console.log('✅ Application démarrée');