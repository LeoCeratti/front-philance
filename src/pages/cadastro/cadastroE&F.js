console.log("Arquivo empresaCadastro.js carregado isoladamente de sua pasta!");

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone")
    const cpfInput = document.getElementById("cpf")
    const cnpjInput = document.getElementById("cnpj")

    inicializarEventosDoCadastro();

    if(emailInput){
        emailInput.addEventListener('blur', verificarEmail);
        }

    if(phoneInput){
        phoneInput.addEventListener("input", formatarPhone);
        phoneInput.addEventListener("blur", verificarPhone);
    }

    if(cpfInput){
        verificarCPF();
    }
    
    if(cnpjInput){
        verificarCNPJ();        
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
    const nascimentoInput = document.getElementById('date-nascimento');
    const criacaoInput = document.getElementById('date-criacao')

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
    let dateValue = "";

    if (tipoUsuarioAtual === 'F' && cpfInput && nascimentoInput) {
        documentoValue = String(cpfInput.value).trim();
        dateValue = String(nascimentoInput.value).trim();
    } else if (tipoUsuarioAtual === 'E' && cnpjInput && criacaoInput) {
        documentoValue = String(cnpjInput.value).trim();
        dateValue = String(criacaoInput.value).trim();
    }

    // 2. Montagem do objeto JSON que vai para o backend
    const dadosFormulario = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput?.value || "",
        birthday: dateValue,
        type: tipoUsuarioAtual,
        password: passwordHashed,
        document: documentoValue,  // Enviado como String
        zip_code: cepInput.value,
        street: ruaInput.value,
        number: numeroInput.value,
        complement: complementoInput.value,
        neighborhood: bairroInput.value,
        city: cidadeInput.value,
        state: ufInput.value
    };

    try {
        const resposta = await fetch('http://localhost:8080/register-user', {
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

// Força a função a ficar pública no navegador
window.nextStep = function(stepNumber) {
    // Esconde todas as seções de etapas
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostra apenas a etapa que você quer ver agora
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.classList.add('active');
    }
};


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
function formatarPhone() {
    const phoneInput = document.getElementById("phone");

    if (!phoneInput) return;

    let phone = phoneInput.value.replace(/\D/g, "");

    phone = phone.substring(0, 11);

    if (phone.length <= 2) {
        phone = phone.replace(/^(\d{0,2})/, "($1");
    } 
    else if (phone.length <= 7) {
        phone = phone.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } 
    else {
        phone = phone.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }

    phoneInput.value = phone;
}

function verificarPhone(){
    const phoneInput = document.getElementById("phone");
    const mensagem = document.getElementById("mensagem-phone");


    const phone = phoneInput.value.replace(/\D/g, "");

    if(phone.length !== 11){
        mensagem.textContent = "Número de celular inválido.";
        phoneInput.removeAttribute("data-valido");
        return false;
    }

    if(phone.charAt(2) !== "9"){
        mensagem.textContent = "Número de celular inválido.";
        phoneInput.removeAttribute("data-valido");
        return false;
    }

    mensagem.textContent = "Telefone válido.";
    phoneInput.setAttribute("data-valido", "true");

    return true;
    
    if(phoneInput === 0){
        mensagem.textContent = "";
    }
}


function verificarCPF() {
    const mensagem = document.getElementById("mensagem-cpf");
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
        if(cpf.length < 0 && cpf.length < 11){
            
            cpfInput.setAttribute("data-valido", "false");
            mensagem.textContent = "CPF incompleto.";
            return;
        }

        if(cpf.length === 0){
        cpfInput.removeAttribute("data-valido");
        document.getElementById("mensagem-cpf").textContent = "";
        return;
         }

        if(cpf.length !== 11){
            
            cpfInput.removeAttribute("data-valido");
            mensagem.textContent = "CPF incompleto.";
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

function verificarCNPJ(){

    const cnpjInput = document.getElementById("cnpj");
    const mensagem = document.getElementById("mensagem-cnpj");

    if(!cnpjInput || !mensagem) return;


    cnpjInput.addEventListener("input", (event)=>{

        let valor = event.target.value.replace(/\D/g,"");


        // Máscara do CNPJ
        if(valor.length <= 14){

            valor = valor.replace(/^(\d{2})(\d)/,"$1.$2");
            valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
            valor = valor.replace(/\.(\d{3})(\d)/,".$1/$2");
            valor = valor.replace(/(\d{4})(\d)/,"$1-$2");

            event.target.value = valor;
        }


        const cnpj = valor.replace(/\D/g,"");


        // Campo vazio
        if(cnpj.length === 0){
            cnpjInput.removeAttribute("data-valido");
            mensagem.textContent = "";
            return;
        }


        if(cnpj.length < 14){
            cnpjInput.setAttribute("data-valido","false");
            mensagem.textContent = "CNPJ incompleto.";
            return;
        }


        // CNPJ completo
        if(verificarCNPJ(cnpj)){

            cnpjInput.setAttribute("data-valido","true");
            mensagem.textContent = "CNPJ Válido.";

        }else{

            cnpjInput.setAttribute("data-valido","false");
            mensagem.textContent = "CNPJ Inválido.";

        }

    });

}
