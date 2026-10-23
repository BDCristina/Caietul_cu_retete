const API_URL = "https://dummyjson.com/recipes";

const formular = document.querySelector("#formular-reteta");
const lista = document.querySelector("#lista-retete");
const statusLista = document.querySelector("#status-lista");
const mesajFormular = document.querySelector("#mesaj-formular");
const cautare = document.querySelector("#cautare");
const butonAdaugare = document.querySelector("#buton-adaugare");

let retete = [];
async function citireEroare(response){
    const data = await response.json().catch(() => null);
    return data?.message || `Eroare HTTP ${response.status}`;
}
function afiseazaMesaj(element, mesaj, tip = ""){
    element.textContent = mesaj;
    element.className = tip;
}
function creeazaCard(reteta) {
  const card = document.createElement("article");
  card.className = "reteta";

  const titlu = document.createElement("h3");
  titlu.textContent = reteta.name;

  const ingrediente = document.createElement("p");
  ingrediente.textContent =
    "Ingrediente: " + reteta.ingredients.join(", ");

  const instructiuni = document.createElement("p");
  instructiuni.textContent =
    "Preparare: " + reteta.instructions.join(" ");

  const timp = document.createElement("p");
  timp.textContent =
    `Timp: ${reteta.prepTimeMinutes} minute`;

  card.append(titlu, ingrediente, instructiuni, timp);
  return card;
}

function afiseazaRetete(listaFiltrata) {
  lista.replaceChildren();

  if (listaFiltrata.length === 0) {
    afiseazaMesaj(statusLista, "Nu exista retete...");
    return;
  }

  afiseazaMesaj(statusLista, "");

  listaFiltrata.forEach(reteta => {
    lista.appendChild(creeazaCard(reteta));
  });
}

function filtreazaRetete() {
  const text = cautare.value.toLowerCase().trim();

  const rezultat = retete.filter(reteta =>
    reteta.name.toLowerCase().includes(text)
  );

  afiseazaRetete(rezultat);
}
async function incarcaRetete() {
  afiseazaMesaj(statusLista, "Se incarca retetele...");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(await citesteEroare(response));
    }

    const data = await response.json();
    retete = data.recipes;
    filtreazaRetete();
  } catch (error) {
    lista.replaceChildren();
    afiseazaMesaj(
      statusLista,
      `Nu s-au putut incarca retetele. ${error.message}`,
      "eroare"
    );
  }
}
async function adaugaReteta(event) {
  event.preventDefault();

  if (!formular.reportValidity()) return;

  const date = new FormData(formular);

  const retetaNoua = {
    name: String(date.get("name")).trim(),
    ingredients: String(date.get("ingredients"))
      .split(",")
      .map(item => item.trim())
      .filter(Boolean),
    instructions: String(date.get("instructions"))
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean),
    prepTimeMinutes: Number(date.get("prepTimeMinutes"))
  };

  if (
    !retetaNoua.name ||
    retetaNoua.ingredients.length === 0 ||
    retetaNoua.instructions.length === 0
  ) {
    afiseazaMesaj(
      mesajFormular,
      "Completeaza toate campurile corect.",
      "eroare"
    );
    return;
  }
  butonAdaugare.disabled = true;
  afiseazaMesaj(mesajFormular, "Se adauga reteta...");
  try {
    const response = await fetch(`${API_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(retetaNoua)
    });
    if (!response.ok) {
      const mesaj = await citesteEroare(response);

      if (response.status >= 400 && response.status < 500) {
        afiseazaMesaj(mesajFormular, mesaj, "eroare");
        return;
      }
      throw new Error(mesaj);
    }
    if (response.status !== 201) {
      throw new Error("Serverul nu a confirmat crearea.");
    }

    const rezultat = await response.json();
    retete.unshift({
      ...retetaNoua,
      id: rezultat.id
    });
    formular.reset();
    cautare.value = "";
    filtreazaRetete();
    afiseazaMesaj(
      mesajFormular,
      "Reteta a fost adaugata.",
      "succes"
    );
  } catch (error) {
    afiseazaMesaj(
      mesajFormular,
      error instanceof TypeError
        ? "Eroare de retea. Incearcă din nou."
        : error.message,
      "eroare"
    );
  } finally {
    butonAdaugare.disabled = false;
  }
}
formular.addEventListener("submit", adaugaReteta);
document.querySelector(".retete-section")
  .addEventListener("input", event => {
    if (event.target.matches("#cautare")) {
      filtreazaRetete();
    }
  });
incarcaRetete();



