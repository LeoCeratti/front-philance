console.log("Arquivo empresaCadastro.js carregado isoladamente de sua pasta!");

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const cpfInput = document.getElementById("cpf")
    const cnpjInput = document.getElementById("cnpj")

    inicializarEventosDoCadastro();
    if(cpfInput){
        verificarCPF();
    }
    
    if(cnpjInput){
        verificarCNPJ();        
    }
    

    
    if(emailInput){
        emailInput.addEventListener('blur', verificarEmail);
        }
});

function inicializarEventosDoCadastro() {
    const btnCadastrar = document.getElementById("btnCadastro");
    if (btnCadastrar) {
        btnCadastrar.addEventListener("click", enviarDadosParaOBackend);
        console.log("Botão de cadastro ativado via Módulo!");
    }
}

let tipoUsuarioAtual = 'F';

// Ouvinte global no documento (Delegação de Eventos)
document.addEventListener('click', (event) => {
    const botaoClicado = event.target.closest('.switch-btn');
    if (!botaoClicado) return;

    // Busca os elementos dinamicamente para evitar erro caso não existam no carregamento
    const secaoFreelancer = document.getElementById('campo-data-freelancer-cadastro');
    const secaoEmpresa = document.getElementById('campo-data-empresa-cadastro');
    const secaoFreelancercpf = document.getElementById('campo-cpf-freelancer-cadastro');
    const secaoEmpresacnpj = document.getElementById('campo-cnpj-empresa-cadastro');

    const botoesSwitch = document.querySelectorAll('.switch-btn');
    botoesSwitch.forEach(b => b.classList.remove('ativo'));
    
    botaoClicado.classList.add('ativo');

    const tipoSelecionado = botaoClicado.dataset.tipo;
    tipoUsuarioAtual = tipoSelecionado;

    // Alterna a exibição com segurança
    if (tipoSelecionado === 'F') {
        secaoFreelancer?.classList.remove('escondido');
        secaoEmpresa?.classList.add('escondido');
        secaoFreelancercpf?.classList.remove('escondido');
        secaoEmpresacnpj?.classList.add('escondido');
        
    } else if (tipoSelecionado === 'E') {
        secaoEmpresa?.classList.remove('escondido');
        secaoFreelancer?.classList.add('escondido');
        secaoEmpresacnpj?.classList.remove('escondido');
        secaoFreelancercpf?.classList.add('escondido');
    }
});

async function passwordHash(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

async function enviarDadosParaOBackend(event) {
    if (event) event.preventDefault();

    /* Dados pessoais */
    const cpfInput = document.getElementById("cpf");
    const cnpjInput = document.getElementById("cnpj");
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('password');
    const phoneInput = document.getElementById('phone');
    const nascimentoInput = document.getElementById('date');

    const cepInput = document.getElementById('cep');
    const ruaInput = document.getElementById('rua');
    const numeroInput = document.getElementById('numero');
    const complementoInput = document.getElementById('complemento');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const ufInput = document.getElementById('uf');

    if (!usernameInput?.value || !emailInput?.value || !senhaInput?.value) {
        alert("Preencha todos os campos obrigatórios (Usuário, E-mail e Senha).");
        return;
    }

    // Gera o hash da senha de forma assíncrona
    const senhaDigitada = senhaInput.value;
    const passwordHashed = await passwordHash(senhaDigitada);

    // 1. Obtenção segura e sanitização da String
    let documentoValue = "";

    if (tipoUsuarioAtual === 'F' && cpfInput) {
        documentoValue = String(cpfInput.value).trim();
    } else if (tipoUsuarioAtual === 'E' && cnpjInput) {
        documentoValue = String(cnpjInput.value).trim();
    }

    // 2. Montagem do objeto JSON que vai para o backend
    const dadosFormulario = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput?.value || "",
        birthday: nascimentoInput?.value || "",
        type: tipoUsuarioAtual,
        password: passwordHashed,
        document: documentoValue  // Enviado como String
    };


    try {
        const resposta = await fetch('https://philance.com.br/api/register-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

    

        const conteudoResposta = await resposta.json().catch(() => null);

        if (resposta.ok) {
            const usuarioLogado = conteudoResposta;

            if (usuarioLogado && tipoUsuarioAtual !== usuarioLogado.type) {
                const perfilCorreto = usuarioLogado.type === 'E' ? 'Empresa' : 'Freelancer';
                alert(`Atenção: Esta conta está registrada como perfil de ${perfilCorreto}. Selecione o tipo correto na tela.`);
                return; 
            }

            alert('Cadastro realizado com sucesso!');
            
            // Salva os dados no navegador
            localStorage.setItem("dadosFormulario", JSON.stringify(usuarioLogado));

            // Redirecionamento direto de página
            if (tipoUsuarioAtual === 'E') {
                window.location.href = "/src/pages/Home/empresa/home.html"; 
            } else if (tipoUsuarioAtual === 'F') {
                window.location.href = "/src/pages/Home/freelancer/homefreelancer.html"; 
            }
        } else {
            const mensagemErro = conteudoResposta?.message || 'Falha ao processar a requisição no servidor.';
            alert(`Erro (${resposta.status}): ${mensagemErro}`);
            console.error('Detalhes do envio:', dadosFormulario);
        }
    } catch (erro) {
        alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        console.error('Erro na requisição:', erro);
    }
}

const cepInput = document.getElementById('cep');

cepInput.addEventListener('input', async (event) => {
       
    const cep = event.target.value.replace(/\D/g, "");

    if (cep.length === 8) {
        try {
            const url = "https://viacep.com.br/ws/" + cep + "/json/";
            const resposta = await fetch(url);
            const dados = await resposta.json();

            if (dados.erro) {
                alert("CEP não encontrado!");
                limparFormulario();
            } else {
                preencherFormulario(dados);
            }
        } catch (erro) {
            console.error("Erro ao buscar o CEP:", erro);
            alert("Erro de conexão ao buscar o CEP.");
            console.log(cep)
        }
    }
});

function preencherFormulario(dados) {
    document.getElementById('rua').value = dados.logradouro;
    document.getElementById('bairro').value = dados.bairro;
    document.getElementById('cidade').value = dados.localidade;
    document.getElementById('uf').value = dados.uf;
}

function limparFormulario() {
    document.getElementById('rua').value = "";
    document.getElementById('bairro').value = "";
    document.getElementById('cidade').value = "";
    document.getElementById('uf').value = "";
}

function verificarCPF() {
    const cpfInput = document.getElementById('cpf');
    if (!cpfInput) return;

    
    cpfInput.addEventListener('input', (event) => {
        let valor = event.target.value.replace(/\D/g, "");
        if (valor.length <= 11) {
            cpfInput.maxLength = 14; 
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            event.target.value = valor;
        }
    const cpf = valor.replace(/\D/g, "");

    if (cpf.length === 11) {
            if (/^(\d)\1{10}$/.test(cpf)) {
                marcarCpfInvalido(cpfInput);
                return;
            }

            let s = 0, r;
            for (let i = 1; i <= 9; i++) {
                s += parseInt(cpf[i - 1]) * (11 - i);
            }
            r = (s * 10) % 11;
            if (r === 10 || r === 11) r = 0;
            if (r !== parseInt(cpf[9])) {
                marcarCpfInvalido(cpfInput);
                return;
            }

            s = 0;
            for (let i = 1; i <= 10; i++) {
                s += parseInt(cpf[i - 1]) * (12 - i);
            }
            r = (s * 10) % 11;
            if (r === 10 || r === 11) r = 0;
            if (r !== parseInt(cpf[10])) {
                marcarCpfInvalido(cpfInput);
                return;
            }

            marcarCpfValido(cpfInput);
        } else {
            cpfInput.removeAttribute('data-valido');
        }
        if(cpf.length === 0){
        cpfInput.removeAttribute("data-valido");
        document.getElementById("mensagem-cpf").textContent = "";
        return;
    }
    });
}

function marcarCpfValido(input) {
    input.setAttribute("data-valido", "true");

    const mensagem = document.getElementById("mensagem-cpf");

    mensagem.textContent = "CPF Válido.";
    
}

function marcarCpfInvalido(input) {
    input.setAttribute("data-valido", "false");

    const mensagem = document.getElementById("mensagem-cpf");
    mensagem.textContent = "CPF Inválido.";
}

function verificarEmail(){
    const emailInput = document.getElementById("email");
    const mensagem = document.getElementById("mensagem-email");

    if(!emailInput) return;

    if(emailInput.value.trim() === ""){
        emailInput.removeAttribute("data-valido");
        document.getElementById("mensagem-email").textContent = "";
        return;
    }

    const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

     if(padrao.test(emailInput.value)) {
        mensagem.textContent = "Email Válido";
        return true;
    } else {
        
        mensagem.textContent = "Email Inválido";
        return false;
    }
    
}

function verificarCNPJ(){
    const cnpjInput = document.getElementById("cnpj");
    const mensagem = document.getElementById("mensagem-cnpj")

    if(!cnpjInput) return;


    cnpjInput.addEventListener("input", (event)=>{

        let valor = event.target.value.replace(/\D/g,"");


        if(valor.length <= 14){

            valor = valor.replace(/^(\d{2})(\d)/,"$1.$2");
            valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
            valor = valor.replace(/\.(\d{3})(\d)/,".$1/$2");
            valor = valor.replace(/(\d{4})(\d)/,"$1-$2");

            event.target.value = valor;

        }


        const cnpj = valor.replace(/\D/g,"");


        if(cnpj.length < 14){
            cnpjInput.removeAttribute("data-valido");
            mensagem.textContent = "";
            return;
        }


        if(validarCNPJ(cnpj)){
            cnpjInput.setAttribute("data-valido","true");
            mensagem.textContent = "CNPJ Válido.";
        }
        else{
            cnpjInput.setAttribute("data-valido","false");
            mensagem.textContent = "CNPJ Inválido.";
        }

    });

}

function validarCNPJ(cnpj) {

    
    if (/^(\d)\1+$/.test(cnpj)) {
        return false;
    }


    //primeiro dígito
    let tamanho = 12;
    let numeros = cnpj.substring(0, tamanho);
    let soma = 0;

    let pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < tamanho; i++) {
        soma += Number(numeros[i]) * pesos[i];
    }

    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;


    //segundo dígito
    tamanho = 13;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;

    pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < tamanho; i++) {
        soma += Number(numeros[i]) * pesos[i];
    }

    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;


    return (
        digito1 === Number(cnpj[12]) &&
        digito2 === Number(cnpj[13])
    );
}
