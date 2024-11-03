stored_crimes= {"contraordenacoes_rodoviarias": [], "contraordenacoes_nauticas": [], "contra_estado": [], "contra_identidade_cultural": [], "contra_patrimonio": [], "contra_pessoas": [], "contra_vida_sociedade": []}
crimes_adicionados = []

function get_api_url() {
    if (window.location.hostname.includes("portugalia.")) {
        return "/calculadora_popsdinner/api"
    } else {
        return "/portugalia/calculadora_popsdinner/api"
    }

}

async function load_crimes_from_db() {
    // contraordanacoes_rodoviarias
    let crimes = await fetch(`${get_api_url()}/crimes/contraordenacoes_rodoviarias`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contraordenacoes_rodoviarias = await crimes.json();

    // contraordanacoes_nauticas
    crimes = await fetch(`${get_api_url()}/crimes/contraordenacoes_nauticas`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contraordenacoes_nauticas = await crimes.json();

    // crimes_contra_estado
    crimes = await fetch(`${get_api_url()}/crimes/contra_estado`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contra_estado = await crimes.json();

    // crimes_identidade_cultural
    crimes = await fetch(`${get_api_url()}/crimes/contra_identidade_cultural`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contra_identidade_cultural = await crimes.json();

    // crimes_patrimonio
    crimes = await fetch(`${get_api_url()}/crimes/contra_patrimonio`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contra_patrimonio = await crimes.json();

    // crimes_pessoas
    crimes = await fetch(`${get_api_url()}/crimes/contra_pessoas`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contra_pessoas = await crimes.json();

    // crimes_vida_sociedade
    crimes = await fetch(`${get_api_url()}/crimes/contra_vida_sociedade`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_crimes.contra_vida_sociedade = await crimes.json();

    // When all finished, build the cards
    search_crimes("");
}

/**
 * @deprecated Since 07/10/2023. Pass proper crimeobject to functions instead of article number
 */
function get_crime_by_article(article, isFine) {
    if (isFine) {
        for (let i = 0; i < stored_crimes.contraordenacoes_rodoviarias.length; i++) {
            if (stored_crimes.contraordenacoes_rodoviarias[i].artigo === article) {
                return stored_crimes.contraordenacoes_rodoviarias[i];
            }
        }
    }

    for (let crime_type in stored_crimes) {
        for (let i = 0; i < stored_crimes[crime_type].length; i++) {
            if (stored_crimes[crime_type][i].artigo === article) {
                return stored_crimes[crime_type][i];
            }
        }
    }
}

function format_crime_article(crime) {
    let subalineas = ["a", "b", "c", "d", "e"];

    let str = "Artigo nº " + crime.artigo;

    if (crime.alinea !== 0) {
        str += "." + crime.alinea;

        if (crime.subalinea !== 0) {
            str += "." + subalineas[crime.subalinea - 1];
        }
    }

    return str;
}

function format_crime_prision(crime) {
    return crime.prisao_min + "-" + crime.prisao + "-" + crime.prisao_max + " anos";
}
function build_crime_card(parent_div, crime) {
    // Create new element
    let card = document.createElement("div");
    card.className = "col card-group"
    card.innerHTML =
        `<div class="card articleCard ${get_color_from_gravity(crime.gravidade)}">
            <div class="card-body">
                <div class="row g-0">
                    <div class="col-auto">
                        <small class="articleType">${format_crime_article(crime)}</small>
                    </div>
                    <div class="col d-flex justify-content-end">
                                <!---->
                                <!---->
                    </div>
                </div>
                    <p>${crime.nome}</p>
            </div>
            <div class="d-flex col-12 articleDetails px-3">
                <span class="col-auto d-flex justify-content-start align-self-center">
                    <i class="fas fa-euro-sign align-self-center"></i> 
                        <span class="text-success">${format_money(crime.coima)}</span>
                </span>
                <span class="col d-flex justify-content-end align-self-center">
                    <i class="far fa-clock align-self-center"></i> 
                        <span class="text-primary">&nbsp;${format_crime_prision(crime)}</span>
                </span>
            </div>
        </div>`;

    card.addEventListener("click", () => {
        add_crime_to_summary(crime);
    });

    document.getElementById(parent_div).appendChild(card);
}

function search_crimes(search) {
    // Store categories names in list
    let categories = ["contraordenacoes_rodoviarias", "contraordenacoes_nauticas", "contra_pessoas", "contra_patrimonio", "contra_identidade_cultural", "contra_vida_sociedade", "contra_estado"]

    // Empty all crime categories
    for (let i = 0; i < categories.length; i++) {
        document.getElementById(categories[i]).innerHTML = "";
    }

    // Search crimes by categories
    categories.forEach((category) => {
        stored_crimes[category].forEach((crime) => {
            if (crime.nome.toLowerCase().includes(search.toLowerCase()) || crime.artigo === search) {
                build_crime_card(category, crime);
            }
        });
    });

}

function add_crime_to_summary(crime) {
    crimes_adicionados.push(crime);
    update_summary();
}

function remove_crime_from_summary(crime) {
    crimes_adicionados.splice(crimes_adicionados.map(c => c.nome).indexOf(crime.nome), 1);
    update_summary();
}

function clear_summary() {
    crimes_adicionados.length = 0;
    update_summary();
}

function copy_articles() {
    let articles = "";
    for (let i = 0; i < crimes_adicionados.length; i++) {
        // Remove text from inside [] brackets
        articles += crimes_adicionados[i].nome.replace(/\[.*?\]/g, "").trimEnd();

        if (i !== crimes_adicionados.length - 1) {
            articles += " | ";
        }

    }
    navigator.clipboard.writeText(articles).then(function() {
        alert("Artigos copiados para a área de transferência! (CTRL + V)");
    }, function() {
        alert("Não foi possível copiar os artigos!");
    });
}

function get_color_from_gravity(gravity) {
    switch (gravity) {
        case 0:
            return "articleFine";
        case 1:
            return "articleMinor";
        case 2:
            return "articleMedian";
        case 3:
            return "articleMajor";
    }
}

function format_money(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function update_summary() {
    // Clean Summary
    document.getElementById("summary_whole_box").innerHTML =
        `<div id="summary_whole_box" class="card sticky-top-resume">
            <div class="card-header">
                <h1 class="text-center">Resumo</h1>
            </div>

            <div id="article_list" class="card-body articleList">
                <p class="text-center"><small>Ainda não foram adicionados artigos</small></p>
            </div>
        </div>`

    // If there are crimes added to summary show them
    if (crimes_adicionados.length > 0) {
        // Add Crimes to List
        let list = document.getElementById("article_list");
        list.innerHTML = "";

        let i;
        crimes_adicionados.forEach((crime) => {
            let crime_json = JSON.stringify(crime);
            list.innerHTML += `<div role="alert" class="col-12 alert alert-dark alert-fine d-flex p-1 px-3">
                    <div class="col-auto">
                        <div class="row text-article">
                            <small>
                                ${format_crime_article(crime)}
                            </small>
                        </div>
                        <div class="row" style="width: 20rem"><small style="word-wrap: break-word">${crime.nome}</small></div>
                        <div class="row text-article">
                            <small>
                                <div style="color: lightgray">
                                    <span><i class="fas fa-euro-sign align-self-center"></i>&nbsp;${format_money(crime.coima)}</span>
                                    &nbsp;
                                    <span><i class="far fa-clock align-self-center"></i>&nbsp;${format_crime_prision(crime)}</span>
                                </div>
                                
                            </small>
                        </div>
                    </div>
                    <div class="col align-items-center d-flex justify-content-end">
                        <a class="text-danger align-middle"><i class="fa fa-times alert-close" onclick='remove_crime_from_summary(${crime_json})'></i></a>
                    </div>
                </div>`;
        });

        // Do the maths
        let total_prision_min = 0
        for (i = 0; i < crimes_adicionados.length; i++) {
            total_prision_min += crimes_adicionados[i].prisao_min;
        }

        let total_prision = 0;
        for (i = 0; i < crimes_adicionados.length; i++) {
            total_prision += crimes_adicionados[i].prisao;
        }

        let total_prision_max = 0;
        for (i = 0; i < crimes_adicionados.length; i++) {
            total_prision_max += crimes_adicionados[i].prisao_max;
        }

        let total_fines = 0;
        for (i = 0; i < crimes_adicionados.length; i++) {
            total_fines += crimes_adicionados[i].coima;
        }

        let total_points = 0;
        for (i = 0; i < crimes_adicionados.length; i++) {
            total_points += crimes_adicionados[i].pontos;
        }

        // Add Summary maths
        document.getElementById("summary_whole_box").innerHTML +=
            `<div class="card-footer articleSums">
                <div class="row">
                    <h5>Total multas: ${format_money(total_fines)} €</h5>
                    ${total_prision_min > 25 ? `<h6>Sentença Mínima: Pena Máxima (${total_prision_min} anos)</h6>`: `<h6>Sentença Mínima: ${total_prision_min} anos</h6>`}
                    ${total_prision > 25 ? `<h6>Sentença Recomendada: Pena Máxima (${total_prision} anos)</h6>`: `<h6>Sentença Recomendada: ${total_prision} anos</h6>`}
                    ${total_prision_max > 25 ? `<h6>Sentença Máxima: Pena Máxima (${total_prision_max} anos)</h6>`: `<h6>Sentença Máxima: ${total_prision_max} anos</h6>`}
                </div>
            </div>`

        // Add Summary Points
        document.getElementById("summary_whole_box").innerHTML +=
            `<div class="card-footer">
                <div class="row">
                    <div class="d-flex col articleSetting"> Redução de pontos </div>
                    <div class="d-flex col justify-content-end"> ${total_points} </div>
                </div>
            </div>`


        // Add Buttons
        document.getElementById("summary_whole_box").innerHTML +=
            `<div class="card-footer">
                <div class="d-grid gap-2 col-12 mx-auto">
                    <button type="button" class="btn btn-outline-primary" onclick="copy_articles()">Copiar artigos</button>
                    <button type="button" class="btn btn-outline-success" onclick="clear_summary()">Limpar</button>
                </div>
            </div>`
    }
}

function collapse_category(category, button) {
    document.getElementById(category).classList.toggle("collapse");

    if (document.getElementById(category).classList.contains("collapse")) {
        button.className = "fa fa-chevron-up alert-collapse";
    } else
        button.className = "fa fa-chevron-down alert-collapse";

}