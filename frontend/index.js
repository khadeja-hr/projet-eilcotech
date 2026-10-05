// ============================================
// BASE DE DONNÉES (localStorage)
// ============================================

const STORAGE_KEY = 'itec_produits';
const USERS_KEY = 'itec_users';
const SESSION_KEY = 'itec_session';

function getProduits() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProduits(produits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produits));
}

// ============================================
// TEST-69 / TEST-70 - GESTION DES UTILISATEURS
// ============================================

function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Vérifie si l'email est valide
 */
function validerEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Vérifie si le mot de passe est valide :
 * - Au moins 8 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 minuscule
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial
 */
function validerMotDePasse(mdp) {
    if (mdp.length < 8) return false;
    if (!/[A-Z]/.test(mdp)) return false;
    if (!/[a-z]/.test(mdp)) return false;
    if (!/[0-9]/.test(mdp)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`;']/.test(mdp)) return false;
    return true;
}

/**
 * TEST-69 - Crée un nouveau compte
 */
function creerCompte(email, password, passwordConfirm) {
    if (!email || !password || !passwordConfirm) {
        return { success: false, message: '❌ Veuillez remplir tous les champs.' };
    }

    if (!validerEmail(email)) {
        return { success: false, message: '❌ Veuillez saisir une adresse email valide.' };
    }

    if (password !== passwordConfirm) {
        return { success: false, message: '❌ Les deux mots de passe ne correspondent pas.' };
    }

    if (!validerMotDePasse(password)) {
        return {
            success: false,
            message: '❌ Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.'
        };
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: '❌ Cette adresse email est déjà utilisée.' };
    }

    const newUser = {
        email: email.trim().toLowerCase(),
        password: password,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    return { success: true, message: '✅ Compte créé avec succès ! Vous pouvez maintenant vous connecter.' };
}

/**
 * TEST-70 - Connecte un utilisateur
 */
function connecter(email, password) {
    if (!email || !password) {
        return { success: false, message: '❌ Veuillez remplir tous les champs.' };
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return { success: false, message: '❌ Email ou mot de passe incorrect.' };
    }

    if (user.password !== password) {
        return { success: false, message: '❌ Email ou mot de passe incorrect.' };
    }

    saveSession({ email: user.email });
    return { success: true, message: '✅ Connexion réussie !' };
}

/**
 * Déconnecte l'utilisateur
 */
function seDeconnecter() {
    clearSession();
    afficherPageAuth();
    document.getElementById('form-connexion').reset();
    document.getElementById('form-inscription').reset();
    document.getElementById('message-connexion').classList.add('hidden');
    document.getElementById('message-inscription').classList.add('hidden');
    afficherOnglet('connexion');
}

function afficherPageAuth() {
    document.getElementById('page-auth').classList.remove('hidden');
    document.getElementById('page-app').classList.add('hidden');
}

function afficherPageApp(email) {
    document.getElementById('page-auth').classList.add('hidden');
    document.getElementById('page-app').classList.remove('hidden');
    document.getElementById('user-affiche').textContent = email;
    recalculerStatutsExistants();
    afficherProduits();
}

function afficherOnglet(onglet) {
    const tabConnexion = document.getElementById('tab-connexion');
    const tabInscription = document.getElementById('tab-inscription');
    const formConnexion = document.getElementById('form-connexion');
    const formInscription = document.getElementById('form-inscription');

    if (onglet === 'connexion') {
        tabConnexion.classList.add('text-primary', 'border-primary');
        tabConnexion.classList.remove('text-gray-500', 'border-transparent');
        tabInscription.classList.remove('text-primary', 'border-primary');
        tabInscription.classList.add('text-gray-500', 'border-transparent');
        formConnexion.classList.remove('hidden');
        formInscription.classList.add('hidden');
    } else {
        tabInscription.classList.add('text-primary', 'border-primary');
        tabInscription.classList.remove('text-gray-500', 'border-transparent');
        tabConnexion.classList.remove('text-primary', 'border-primary');
        tabConnexion.classList.add('text-gray-500', 'border-transparent');
        formInscription.classList.remove('hidden');
        formConnexion.classList.add('hidden');
    }
}

function afficherMessageAuth(elementId, texte, type) {
    const element = document.getElementById(elementId);
    element.textContent = texte;
    element.className = `mt-4 p-3 rounded-lg text-sm font-semibold ${
        type === 'success'
            ? 'bg-green-100 text-green-800 border-2 border-green-300'
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
}

// ============================================
// RÈGLES MÉTIER
// ============================================

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
const QUANTITE_MIN = 1;
const QUANTITE_MAX = 10;

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

// ============================================
// TEST-63 - CALCUL DU STATUT
// ============================================

function calculerStatut(quantite) {
    if (quantite === 0) return 'Rupture de stock';
    else if (quantite >= 1 && quantite < 5) return 'Stock limité';
    else return 'Stock disponible';
}

function getClassesStatut(statut) {
    switch (statut) {
        case 'Rupture de stock': return 'bg-red-100 text-red-800';
        case 'Stock limité': return 'bg-orange-100 text-orange-800';
        case 'Stock disponible': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function recalculerStatutsExistants() {
    const produits = getProduits();
    let modifie = false;
    produits.forEach(p => {
        const nouveauStatut = calculerStatut(p.quantite);
        if (p.statut !== nouveauStatut) {
            p.statut = nouveauStatut;
            modifie = true;
        }
    });
    if (modifie) saveProduits(produits);
}

// ============================================
// AJOUTER UN PRODUIT
// ============================================

function ajouterProduit(produit) {
    const produits = getProduits();

    if (produits.some(p => p.reference === produit.reference)) {
        return { success: false, message: `❌ La référence "${produit.reference}" existe déjà !` };
    }

    const doublon = produits.find(p =>
        p.nom.toLowerCase() === produit.nom.toLowerCase() &&
        p.version.toLowerCase() === produit.version.toLowerCase()
    );
    if (doublon) {
        return { success: false, message: `❌ Le produit "${produit.nom} - ${produit.version}" existe déjà !` };
    }

    if (isNaN(produit.quantite) || produit.quantite < QUANTITE_MIN || produit.quantite > QUANTITE_MAX) {
        return { success: false, message: `❌ La quantité doit être comprise entre ${QUANTITE_MIN} et ${QUANTITE_MAX}.` };
    }

    const marquesAutorisees = getMarquesAutorisees(produit.categorie, produit.sousCategorie);
    if (!marquesAutorisees.includes(produit.marque)) {
        return { success: false, message: `❌ La marque "${produit.marque}" n'est pas autorisée pour cette catégorie.` };
    }

    if (compterProduitsParMarque(produit.categorie, produit.sousCategorie, produit.marque) >= MAX_PRODUITS_PAR_MARQUE) {
        return { success: false, message: `❌ La marque "${produit.marque}" a déjà ${MAX_PRODUITS_PAR_MARQUE} produits.` };
    }

    produit.statut = calculerStatut(produit.quantite);
    produits.push(produit);
    saveProduits(produits);
    return { success: true, message: `✅ Produit "${produit.nom} - ${produit.version}" ajouté avec succès !` };
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

// ============================================
// GESTION DYNAMIQUE DU FORMULAIRE
// ============================================

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

// ============================================
// SOUMISSION DU FORMULAIRE D'AJOUT
// ============================================

document.getElementById('form-ajout').addEventListener('submit', function(e) {
    e.preventDefault();

    const categorie = document.getElementById('categorie').value;
    const sousCategorie = document.getElementById('sousCategorie').value;
    const marque = document.getElementById('marque').value;
    const nom = document.getElementById('nom').value.trim();
    const version = document.getElementById('version').value.trim();
    const quantiteRaw = document.getElementById('quantite').value;
    const quantite = parseInt(quantiteRaw);

    if (!categorie || !marque || !nom || !version) {
        afficherMessage('❌ Veuillez remplir tous les champs.', 'error');
        return;
    }
    if (quantiteRaw === '' || isNaN(quantite)) {
        afficherMessage('❌ Veuillez saisir une quantité valide.', 'error');
        return;
    }
    if (quantite < QUANTITE_MIN || quantite > QUANTITE_MAX) {
        afficherMessage(`❌ La quantité doit être comprise entre ${QUANTITE_MIN} et ${QUANTITE_MAX}.`, 'error');
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
        afficherProduits();
    }
});

// ============================================
// CONSULTER LES PRODUITS
// ============================================

function getProduitParReference(reference) {
    const produits = getProduits();
    return produits.find(p => p.reference === reference) || null;
}

// ============================================
// RECHERCHER UN PRODUIT
// ============================================

function filtrerProduits(motCle) {
    const produits = getProduits();
    if (!motCle || motCle.trim() === '') return produits;

    const motCleNormalise = motCle.trim().toLowerCase();
    return produits.filter(produit => {
        const nom = (produit.nom || '').toLowerCase();
        const marque = (produit.marque || '').toLowerCase();
        const reference = (produit.reference || '').toLowerCase();
        const categorie = (produit.categorie || '').toLowerCase();
        const sousCategorie = (produit.sousCategorie || '').toLowerCase();
        const version = (produit.version || '').toLowerCase();

        return nom.includes(motCleNormalise) ||
               marque.includes(motCleNormalise) ||
               reference.includes(motCleNormalise) ||
               categorie.includes(motCleNormalise) ||
               sousCategorie.includes(motCleNormalise) ||
               version.includes(motCleNormalise);
    });
}

function afficherProduits(motCle = '') {
    const produits = filtrerProduits(motCle);
    const container = document.getElementById('liste-produits');
    const compteur = document.getElementById('compteur-resultats');

    if (motCle && motCle.trim() !== '') {
        compteur.textContent = `${produits.length} résultat(s) trouvé(s)`;
    } else {
        compteur.textContent = `${produits.length} produit(s) au total`;
    }

    if (getProduits().length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <p class="text-5xl mb-3">📭</p>
                <p class="text-lg">Aucun produit dans le catalogue.</p>
                <p class="text-sm">Ajoutez votre premier produit ci-dessus.</p>
            </div>
        `;
        return;
    }

    if (produits.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <p class="text-5xl mb-3">🔍</p>
                <p class="text-lg font-semibold">Aucun produit trouvé.</p>
                <p class="text-sm">Essayez avec un autre mot-clé.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = produits.map(produit => `
        <div class="border-l-4 border-primary bg-gray-50 rounded-lg p-4 hover:shadow-md transition">
            <div onclick="afficherDetail('${produit.reference}')" class="cursor-pointer">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-gray-800">
                        ${produit.nom} <span class="text-primary">- ${produit.version}</span>
                    </h3>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${getClassesStatut(produit.statut)}">
                        ${produit.statut}
                    </span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div><span class="font-semibold text-gray-700">Marque :</span> <span>${produit.marque}</span></div>
                    <div><span class="font-semibold text-gray-700">Catégorie :</span> <span>${produit.categorie}</span></div>
                    ${produit.sousCategorie ? `<div><span class="font-semibold text-gray-700">Sous-catégorie :</span> <span>${produit.sousCategorie}</span></div>` : ''}
                    <div><span class="font-semibold text-gray-700">Référence :</span> <span class="font-mono">${produit.reference}</span></div>
                    <div><span class="font-semibold text-gray-700">Quantité :</span> <span class="font-bold">${produit.quantite}</span></div>
                </div>
            </div>
            <div class="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button onclick="afficherDetail('${produit.reference}')"
                        class="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">👁️ Détail</button>
                <button onclick="ouvrirModification('${produit.reference}')"
                        class="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition">✏️ Modifier</button>
                <button onclick="ouvrirConfirmationSuppression('${produit.reference}')"
                        class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// RECHERCHE
// ============================================

const champRecherche = document.getElementById('champ-recherche');
const btnEffacerRecherche = document.getElementById('btn-effacer-recherche');

champRecherche.addEventListener('input', function() {
    const motCle = this.value;
    afficherProduits(motCle);
    if (motCle.trim() !== '') btnEffacerRecherche.classList.remove('hidden');
    else btnEffacerRecherche.classList.add('hidden');
});

btnEffacerRecherche.addEventListener('click', function() {
    champRecherche.value = '';
    afficherProduits('');
    this.classList.add('hidden');
    champRecherche.focus();
});

// ============================================
// DÉTAIL
// ============================================

function afficherDetail(reference) {
    const produit = getProduitParReference(reference);
    if (!produit) return;

    const contenu = document.getElementById('modal-contenu');
    contenu.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h4 class="text-2xl font-bold text-gray-800">
                ${produit.nom} <span class="text-primary">- ${produit.version}</span>
            </h4>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${getClassesStatut(produit.statut)}">
                ${produit.statut}
            </span>
        </div>
        <div class="space-y-3">
            <div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Marque</span><span>${produit.marque}</span></div>
            <div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Catégorie</span><span>${produit.categorie}</span></div>
            ${produit.sousCategorie ? `<div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Sous-catégorie</span><span>${produit.sousCategorie}</span></div>` : ''}
            <div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Version</span><span>${produit.version}</span></div>
            <div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Référence</span><span class="font-mono">${produit.reference}</span></div>
            <div class="flex border-b border-gray-100 pb-2"><span class="w-40 font-semibold text-gray-600">Quantité en stock</span><span class="font-bold text-lg">${produit.quantite}</span></div>
        </div>
        <div class="flex gap-2 mt-6 pt-4 border-t border-gray-200">
            <button onclick="fermerModal(); ouvrirModification('${produit.reference}');"
                    class="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition">✏️ Modifier</button>
            <button onclick="fermerModal(); ouvrirConfirmationSuppression('${produit.reference}');"
                    class="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition">🗑️ Supprimer</button>
        </div>
    `;
    document.getElementById('modal-detail').classList.remove('hidden');
}

function fermerModal() {
    document.getElementById('modal-detail').classList.add('hidden');
}

document.getElementById('modal-detail').addEventListener('click', function(e) {
    if (e.target === this) fermerModal();
});

// ============================================
// SUPPRIMER
// ============================================

function ouvrirConfirmationSuppression(reference) {
    const produit = getProduitParReference(reference);
    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }
    const infoDiv = document.getElementById('modal-suppression-info');
    infoDiv.innerHTML = `
        <p class="text-gray-800"><strong>Nom :</strong> ${produit.nom} - ${produit.version}</p>
        <p class="text-gray-800 mt-1"><strong>Référence :</strong> <span class="font-mono">${produit.reference}</span></p>
    `;
    document.getElementById('btn-confirmer-suppression').dataset.reference = reference;
    document.getElementById('modal-suppression').classList.remove('hidden');
}

function fermerModalSuppression() {
    document.getElementById('modal-suppression').classList.add('hidden');
}

function confirmerSuppression() {
    const reference = document.getElementById('btn-confirmer-suppression').dataset.reference;
    if (!reference) {
        afficherMessage('❌ Aucune référence à supprimer.', 'error');
        fermerModalSuppression();
        return;
    }
    const produits = getProduits();
    const produit = produits.find(p => p.reference === reference);
    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        fermerModalSuppression();
        return;
    }
    const nouveauxProduits = produits.filter(p => p.reference !== reference);
    saveProduits(nouveauxProduits);
    fermerModalSuppression();
    afficherMessage(`✅ Produit "${produit.nom} - ${produit.version}" supprimé.`, 'success');
    afficherProduits();
}

document.getElementById('btn-confirmer-suppression').addEventListener('click', confirmerSuppression);
document.getElementById('modal-suppression').addEventListener('click', function(e) {
    if (e.target === this) fermerModalSuppression();
});

// ============================================
// MODIFIER
// ============================================

function ouvrirModification(reference) {
    const produit = getProduitParReference(reference);
    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    document.getElementById('mod-reference-originale').value = produit.reference;
    document.getElementById('mod-categorie').value = produit.categorie;
    document.getElementById('mod-nom').value = produit.nom;
    document.getElementById('mod-version').value = produit.version;
    document.getElementById('mod-reference').value = produit.reference;

    const modQuantite = document.getElementById('mod-quantite');
    modQuantite.value = produit.quantite;
    modQuantite.disabled = true;

    const divReappro = document.getElementById('div-reapprovisionner');
    const inputReappro = document.getElementById('mod-reapprovisionnement');
    if (produit.quantite === 0) {
        divReappro.classList.remove('hidden');
        inputReappro.value = '';
    } else {
        divReappro.classList.add('hidden');
        inputReappro.value = '';
    }

    const modDivSousCategorie = document.getElementById('mod-div-sous-categorie');
    const modSousCategorie = document.getElementById('mod-sousCategorie');
    if (produit.categorie === 'Électroménagers') {
        modDivSousCategorie.classList.remove('hidden');
        modSousCategorie.required = true;
        modSousCategorie.value = produit.sousCategorie || '';
    } else {
        modDivSousCategorie.classList.add('hidden');
        modSousCategorie.required = false;
        modSousCategorie.value = '';
    }

    mettreAJourMarquesModification();
    document.getElementById('mod-marque').value = produit.marque;
    document.getElementById('modal-modification').classList.remove('hidden');
}

function mettreAJourMarquesModification() {
    const categorie = document.getElementById('mod-categorie').value;
    const sousCategorie = document.getElementById('mod-sousCategorie').value;
    const selectMarqueMod = document.getElementById('mod-marque');
    selectMarqueMod.innerHTML = '<option value="">-- Choisir --</option>';
    if (!categorie) return;
    const marques = getMarquesAutorisees(categorie, sousCategorie);
    marques.forEach(marque => {
        const option = document.createElement('option');
        option.value = marque;
        option.textContent = marque;
        selectMarqueMod.appendChild(option);
    });
}

function fermerModalModification() {
    document.getElementById('modal-modification').classList.add('hidden');
}

document.getElementById('mod-categorie').addEventListener('change', function() {
    const categorie = this.value;
    const modDivSousCategorie = document.getElementById('mod-div-sous-categorie');
    const modSousCategorie = document.getElementById('mod-sousCategorie');
    if (categorie === 'Électroménagers') {
        modDivSousCategorie.classList.remove('hidden');
        modSousCategorie.required = true;
    } else {
        modDivSousCategorie.classList.add('hidden');
        modSousCategorie.required = false;
        modSousCategorie.value = '';
    }
    mettreAJourMarquesModification();
});

document.getElementById('mod-sousCategorie').addEventListener('change', mettreAJourMarquesModification);
document.getElementById('modal-modification').addEventListener('click', function(e) {
    if (e.target === this) fermerModalModification();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fermerModal();
        fermerModalSuppression();
        fermerModalModification();
    }
});

// ============================================
// RÉAPPROVISIONNEMENT
// ============================================

document.getElementById('btn-reapprovisionner').addEventListener('click', function() {
    const reference = document.getElementById('mod-reference-originale').value;
    const quantiteAAjouter = parseInt(document.getElementById('mod-reapprovisionnement').value);

    if (isNaN(quantiteAAjouter) || quantiteAAjouter < 1 || quantiteAAjouter > 10) {
        afficherMessage('❌ La quantité à ajouter doit être comprise entre 1 et 10.', 'error');
        return;
    }

    const produits = getProduits();
    const index = produits.findIndex(p => p.reference === reference);
    if (index === -1) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    const produit = produits[index];
    const nouvelleQuantite = produit.quantite + quantiteAAjouter;

    if (nouvelleQuantite > QUANTITE_MAX) {
        afficherMessage(`❌ La quantité totale ne peut pas dépasser ${QUANTITE_MAX}.`, 'error');
        return;
    }

    produits[index].quantite = nouvelleQuantite;
    produits[index].statut = calculerStatut(nouvelleQuantite);
    saveProduits(produits);

    document.getElementById('mod-quantite').value = nouvelleQuantite;
    if (nouvelleQuantite > 0) {
        document.getElementById('div-reapprovisionner').classList.add('hidden');
    }

    afficherMessage(`✅ Réapprovisionnement réussi ! Nouvelle quantité : ${nouvelleQuantite}`, 'success');
    afficherProduits();
});

// ============================================
// SOUMISSION DU FORMULAIRE DE MODIFICATION
// ============================================

document.getElementById('form-modification').addEventListener('submit', function(e) {
    e.preventDefault();

    const referenceOriginale = document.getElementById('mod-reference-originale').value;
    const categorie = document.getElementById('mod-categorie').value;
    const sousCategorie = document.getElementById('mod-sousCategorie').value;
    const marque = document.getElementById('mod-marque').value;
    const nom = document.getElementById('mod-nom').value.trim();
    const version = document.getElementById('mod-version').value.trim();
    const reference = document.getElementById('mod-reference').value.trim();

    if (!categorie || !marque || !nom || !version || !reference) {
        afficherMessage('❌ Veuillez remplir tous les champs.', 'error');
        return;
    }
    if (categorie === 'Électroménagers' && !sousCategorie) {
        afficherMessage('❌ Veuillez choisir une sous-catégorie.', 'error');
        return;
    }

    const produits = getProduits();
    if (reference !== referenceOriginale) {
        if (produits.some(p => p.reference === reference)) {
            afficherMessage(`❌ La référence "${reference}" existe déjà !`, 'error');
            return;
        }
    }

    const doublon = produits.find(p =>
        p.reference !== referenceOriginale &&
        p.nom.toLowerCase() === nom.toLowerCase() &&
        p.version.toLowerCase() === version.toLowerCase()
    );
    if (doublon) {
        afficherMessage(`❌ Le produit "${nom} - ${version}" existe déjà !`, 'error');
        return;
    }

    const marquesAutorisees = getMarquesAutorisees(categorie, sousCategorie);
    if (!marquesAutorisees.includes(marque)) {
        afficherMessage(`❌ La marque "${marque}" n'est pas autorisée.`, 'error');
        return;
    }

    const index = produits.findIndex(p => p.reference === referenceOriginale);
    if (index === -1) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    const produitExistant = produits[index];
    produits[index] = {
        nom, marque, categorie,
        sousCategorie: categorie === 'Électroménagers' ? sousCategorie : null,
        version, reference,
        quantite: produitExistant.quantite,
        statut: produitExistant.statut
    };

    saveProduits(produits);
    fermerModalModification();
    afficherMessage(`✅ Produit "${nom} - ${version}" modifié avec succès !`, 'success');
    afficherProduits();
});

// ============================================
// GESTION DES FORMULAIRES D'AUTHENTIFICATION
// ============================================

// Soumission CONNEXION (TEST-70)
document.getElementById('form-connexion').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const resultat = connecter(email, password);

    if (resultat.success) {
        afficherMessageAuth('message-connexion', resultat.message, 'success');
        setTimeout(() => afficherPageApp(email), 800);
    } else {
        afficherMessageAuth('message-connexion', resultat.message, 'error');
    }
});

// Soumission INSCRIPTION (TEST-69)
document.getElementById('form-inscription').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    const resultat = creerCompte(email, password, passwordConfirm);

    if (resultat.success) {
        afficherMessageAuth('message-inscription', resultat.message, 'success');
        setTimeout(() => {
            document.getElementById('form-inscription').reset();
            afficherOnglet('connexion');
            document.getElementById('login-email').value = email;
        }, 1500);
    } else {
        afficherMessageAuth('message-inscription', resultat.message, 'error');
    }
});

// ============================================
// INITIALISATION
// ============================================

recalculerStatutsExistants();

// Vérifier si l'utilisateur est déjà connecté
const session = getSession();
if (session) {
    afficherPageApp(session.email);
} else {
    afficherPageAuth();
}

console.log('✅ Application démarrée');