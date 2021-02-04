/** 
 * @param {String} string - URL para onde vai ser feita a requisição.
 * @param {callback} callback - Callback usada para realizar o tratamento da resposta da requisição.
 * @param {String} id - ID para a requisição, não necessario.
 */
function GET(url, callback, id) {
    const xhr = new XMLHttpRequest();

    url = id ? `${url}?id=${id}` : url;

    xhr.open('GET', url, true);

    xhr.onload = () => {
        if (xhr.readyState == 4) {
            callback(JSON.parse(xhr.responseText));
        }
    }

    xhr.send();
}

/**
 * @param {String} url - URL para onde a requisição vai ser feita.
 * @param {callback} callback - Callback para executar alterações após a resposta da requisição.
 * @param {Object} args - Argumentos extras: id, titulo, subtitulo, etc. 
 */
function POST(url, callback, args) {
    $.ajax({
        type: "POST",
        url: url,
        data: args,
        success: callback,
    });
}

/** Realiza a troca do titulo do conteudo de acordo com o que está sendo mostrado.*/
function changeContentHeader(title) {
    document.querySelector('.content-header h1').innerHTML = title;
}

/** Limpa os inputs do formulario.*/
function clearInputs() {
    const inputElements = document.querySelectorAll('.inputs');
    inputElements.forEach(item => item.value = '');
}

/** Função que torna o formulario visivel.*/
function showForm() {
    const form = document.querySelector('form');
    form.classList.remove('hide');

    // Aqui é feita uma condição para ver se o usuario vai editar o cadastrar uma noticia.
    const title = form.id ? 'Editar' : 'Cadastrar';
    document.querySelector('#cadastrar').innerHTML = title;

    // Caso o usuario tenha clicado em editar, não limpa os campos do formulario.
    if (!form.id) {
        clearInputs();
        document.querySelector('option').selected = true;
    }

    changeContentHeader(title);
    removeNoticias();
}

/** Usada para remover o formulario da visão do usuario.*/
function removeForm() {
    const form = document.querySelector('form');
    form.removeAttribute('id');
    form.classList.add('hide');
}

/** Usada para remover as noticias da visão do usuario.*/
function removeNoticias() {
    const noticias = document.querySelector('.notiticas');
    noticias && noticias.parentNode.removeChild(noticias);
}

/** Responsavel por preencher os inputs com as informações da noticia selecionada.
 * @param {Object} noticiaObject - Objeto com informações da noticia.
 * @param {Number|String} categoryId - Id da categoria que a noticia pertence.
 */
function handleEditNoticia(noticiaObject, categoryId) {
    // Deixa selecionado a categoria da noticia.
    const option = Array.from(document.querySelectorAll('option')).find(elem => elem.id == categoryId);
    option.selected = 'selected';

    // Pega o subtitulo e o titulo
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach(input => {
        input.value = input.id == 'titulo' ? noticiaObject.titulo : noticiaObject.subtitulo;
    });

    const textArea = document.querySelector('textarea');
    textArea.value = noticiaObject.conteudo;

    document.querySelector('form').id = noticiaObject.id;
}

/** Responsavel por criar toda a estrutura das noticias listadas.
 * @param {Object} parsedResponse - Resposta do requisição com todos os dados das noticias.
 * @param {Object} menuObject - Objeto com as informações da categoria: {id: ?, nome: ?}.
 */
function listAllNoticias(parsedResponse, menuObject) {

    const divContent = document.createElement('div');
    divContent.classList.add('notiticas');

    parsedResponse.forEach(noticia => {
        const div = document.createElement('div');
        div.classList.add('noticia')

        const h2 = document.createElement('h2');
        h2.innerHTML = noticia.titulo;

        const h4 = document.createElement('h4');
        h4.innerHTML = noticia.subtitulo;

        const p = document.createElement('p');
        p.innerHTML = noticia.conteudo;

        const footer = document.createElement('footer');
        footer.classList.add('blockquote-footer');
        footer.innerHTML = noticia.data;

        const array = [h2, h4, p, footer];
        array.forEach(item => {
            div.appendChild(item);
        });

        if (noticia.editavel) {
            const editButton = document.createElement('button');
            const removeButton = document.createElement('button');

            editButton.classList.add('btn');
            editButton.classList.add('btn-primary');
            removeButton.classList.add('btn');
            removeButton.classList.add('btn-danger');

            editButton.innerHTML = 'Editar';
            removeButton.innerHTML = 'Deletar';

            editButton.addEventListener('click', () => {
                handleEditNoticia(noticia, menuObject.id);
                showForm();
            });

            removeButton.addEventListener('click', () => {
                GET('https://tiagoifsp.ddns.net/noticias/noticias/deletar.php', () => {
                    toastr.success('Notícia removida com sucesso');
                    // Caso o usuario clique em remover, ele chama a função que cria as noticias.
                    handleMenuClick(menuObject);
                }, noticia.id);
            });

            div.appendChild(editButton);
            div.appendChild(removeButton);
        }

        divContent.appendChild(div);
    });
    document.querySelector('.content-body').appendChild(divContent);
}

/** Responsavel por limpar a tela, mudar o titulo da página e chamar a função que monta a lista na tela. 
 * @param {Object} menuObject - Objeto com as informações da categoria: {id: ?, nome: ?}.
 */
function handleMenuClick(menuObject) {
    const url = 'https://tiagoifsp.ddns.net/noticias/noticias/listar.php';
    GET(url, (parsedResponse) => {
        // Usado para remover as noticias que estavam na tela.
        removeNoticias();
        removeForm();
        changeContentHeader(menuObject.nome);
        listAllNoticias(parsedResponse, menuObject);
    }, menuObject.id);
}

/**
 * @param {Object} menuObject - Objeto {id: ?, nome: ?}.
 */
function createMenuItem(menuObject) {
    const menu = document.querySelector('.menu-options');
    const div = document.createElement('div');
    div.classList.add('menu-item');
    div.id = menuObject.id;
    div.innerHTML = menuObject.nome;

    // Quando o botão for clicado ele faz.
    div.addEventListener('click', () => {
        handleMenuClick(menuObject);
    });

    menu.appendChild(div);
}

/**
 * @param {Object} parsedJson - Array de objetos no formato {id: ?, nome: ?}.
 */
function handleMenuItems(parsedJson) {
    const select = document.querySelector('select');

    parsedJson.forEach(object => {
        // Cria o menu.
        createMenuItem(object);

        // Cria a opção no formulario.
        const option = document.createElement('option');
        option.id = object.id;
        option.innerHTML = object.nome;
        select.appendChild(option);
    });
}

/** Realiza o cadastro ou edição de uma noticia.
 * A logica utilizada para ver se é cadastro ou alteração é ver se o formulario tem um id, caso ele tenha é pq a noticia ja existe,
 * logo é uma  alteração, caso contrario é cadastro.
*/
function sendCadastro() {
    const payload = {};

    const form = document.querySelector('form');
    if (form.id) {
        payload.id = Number(form.id);
    }

    const inputs = Array.from(document.querySelectorAll('input'));
    // Pega os titulo e subtitulo
    inputs.forEach(input => {
        payload[input.id] = input.value;
    });

    payload.conteudo = document.querySelector('textarea').value;

    const select = document.querySelector('select');
    const idCategoria = select[select.options.selectedIndex].id;
    payload.idCategoria = Number(idCategoria);

    const baseURL = 'https://tiagoifsp.ddns.net/noticias/';
    const sendURL = form.id ? baseURL + 'noticias/editar.php' : baseURL + 'noticias/cadastrar.php';

    const displayMessage = `Notícia ${form.id ? 'alterada' : 'criada'} com sucesso.`;

    console.log(payload)

    POST(sendURL, (response) => {
        if (response.status !== 'erro') {
            toastr.success(displayMessage);
            removeForm();
            changeContentHeader('');
        } else {
            toastr.error('Erro ao adicionar a notícia.');
        }
    }, payload);
}

function toasterOptions() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }
}

document.addEventListener('DOMContentLoaded', function (e) {
    const baseURL = 'https://tiagoifsp.ddns.net/noticias/';
    const menuURL = baseURL + './categorias/listar.php';
    toasterOptions();
    GET(menuURL, handleMenuItems);

    document.querySelector('#menu-cadastrar').addEventListener('click', (e) => {
        removeForm();
        showForm();
    });
    document.querySelector('#cadastrar').addEventListener('click', () => {
        sendCadastro();
    });
});