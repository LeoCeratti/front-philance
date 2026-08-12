console.log("Arquivo empresaCadastro.js carregado isoladamente de sua pasta!");

document.addEventListener("DOMContentLoaded", () => {
    const nomeInput = document.getElementById("username");
    const nascimentoInput = document.getElementById("date-nascimento");
    const criacaoInput = document.getElementById("date-criacao");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const cpfInput = document.getElementById("cpf");
    const cnpjInput = document.getElementById("cnpj");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const sobreFreelancerInput = document.getElementById("sobre-freelancer");
    const sobreEmpresaInput = document.getElementById("sobre-empresa");
    const cepInput = document.getElementById("cep");
    const tagsInputs = document.querySelectorAll('input[name="tags"]');
    

    inicializarEventosDoCadastro();

    if(nomeInput){
        verificarNome();
    }
    if(nascimentoInput){
        nascimentoInput.max = new Date().toISOString().split("T")[0];
        verificarIdade();
    }
    if(criacaoInput){
        criacaoInput.max = new Date().toISOString().split("T")[0];
        verificarDataEmpresa();
    }
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

    if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener("input", verificarPassword);
        confirmPasswordInput.addEventListener("input", verificarPassword);
    }
    if(sobreFreelancerInput){
        sobreFreelancerInput.addEventListener("input", verificarSobre);
        sobreFreelancerInput.addEventListener("blur", verificarSobre);
    }
    if(sobreEmpresaInput){
        sobreEmpresaInput.addEventListener("input", verificarSobre);
        sobreEmpresaInput.addEventListener("blur", verificarSobre);
    }
    if (cepInput) {
        cepInput.addEventListener("input", verificarCep);
        cepInput.addEventListener("blur", verificarCep);
    }
    if (tagsInputs.length > 0) {
        tagsInputs.forEach(tag => tag.addEventListener("change", verificarTags));
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

    const secaoFreelancerSobre = document.getElementById('campo-sobre-freelancer-cadastro');
    const secaoEmpresaSobre = document.getElementById('campo-sobre-empresa-cadastro');

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
        secaoFreelancerSobre?.classList.remove('escondido');
        secaoEmpresaSobre?.classList.add('escondido');
        
    } else if (tipoSelecionado === 'E') {
        secaoEmpresa?.classList.remove('escondido');
        secaoFreelancer?.classList.add('escondido');
        secaoEmpresacnpj?.classList.remove('escondido');
        secaoFreelancercpf?.classList.add('escondido');
        secaoEmpresaSobre?.classList.remove('escondido');
        secaoFreelancerSobre?.classList.add('escondido');
    }
});

// Evento do CEP para consulta no ViaCEP
document.addEventListener("DOMContentLoaded", () => {
    const cepInput = document.getElementById('cep');

    if (cepInput) {
        cepInput.addEventListener('input', async (event) => {
            let valor = event.target.value.replace(/\D/g, "");

            // Aplica mascara visual 00000-000
            if (valor.length > 5) {
                event.target.value = valor.replace(/^(\d{5})(\d)/, "$1-$2");
            } else {
                event.target.value = valor;
            }

            if (valor.length === 8) {
                try {
                    const url = "https://viacep.com.br/ws/" + valor + "/json/";
                    const resposta = await fetch(url);
                    const dados = await resposta.json();

                    if (dados.erro) {
                        alert("CEP não encontrado!");
                        limparFormulario();
                    } else {
                        preencherFormulario(dados);
                        verificarCep();
                    }
                } catch (erro) {
                    console.error("Erro ao buscar o CEP:", erro);
                    alert("Erro de conexão ao buscar o CEP.");
                }
            }
        });
    }
});

function preencherFormulario(dados) {
    document.getElementById('rua').value = dados.logradouro || "";
    document.getElementById('bairro').value = dados.bairro || "";
    document.getElementById('cidade').value = dados.localidade || "";
    document.getElementById('uf').value = dados.uf || "";
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
    const criacaoInput = document.getElementById('date-criacao');
    const cepInput = document.getElementById('cep');
    const ruaInput = document.getElementById('rua');
    const numeroInput = document.getElementById('numero');
    const complementoInput = document.getElementById('complemento');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const ufInput = document.getElementById('uf');

    const sobreInput = tipoUsuarioAtual === 'F' 
        ? document.getElementById('sobre-freelancer') 
        : document.getElementById('sobre-empresa');

    const tagSelecionada = document.querySelector('input[name="tags"]:checked')?.value || "";

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
        documentoValue = String(cpfInput.value).trim().replace(/\D/g,"");
        dateValue = String(nascimentoInput.value).trim();
    } else if (tipoUsuarioAtual === 'E' && cnpjInput && criacaoInput) {
        documentoValue = String(cnpjInput.value).trim().replace(/\D/g,"");
        dateValue = String(criacaoInput.value).trim();
    }
    if (!verificarTags()) {
        return; 
    }

    // 2. Montagem do objeto JSON que vai para o backend
    const dadosFormulario = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput?.value || "",
        birthday: dateValue,
        type: tipoUsuarioAtual,
        password: passwordHashed,
        document: documentoValue, 
        tag: tagSelecionada,
        zip_code:  cepInput.value.replace(/\D/g, ""),
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

window.nextStep = function(stepNumber) {

    if(stepNumber === 2){

        let valido = true;

        const nome = document.getElementById("username");
        const email = document.getElementById("email");
        const phone = document.getElementById("phone");
        const senha = document.getElementById("password");
        const confirmar = document.getElementById("confirm-password");

        // Limpa mensagem anterior
        const mensagemAntiga = document.getElementById("mensagem-avancar");

        if(mensagemAntiga){
            mensagemAntiga.remove();
        }

        // Nome
        if(nome.value.trim() === ""){
            document.getElementById("mensagem-nome").textContent = "Digite seu nome completo.";
            nome.setAttribute("data-valido","false");
            valido = false;
        }else{
            document.getElementById("mensagem-nome").textContent = "";
            nome.setAttribute("data-valido","true");
        }

        // Data freelancer / empresa
        if(tipoUsuarioAtual === "F"){
            const nascimento = document.getElementById("date-nascimento");
            if(nascimento.getAttribute("data-valido") !== "true"){
                valido = false;
            }
        }else{
            const criacao = document.getElementById("date-criacao");
            if(criacao.getAttribute("data-valido") !== "true"){
                valido = false;
            }
        }

        // Email
        verificarEmail();
        if(email.getAttribute("data-valido") !== "true"){
            valido = false;
        }

        // Telefone
        verificarPhone();
        if(phone.getAttribute("data-valido") !== "true"){
            valido = false;
        }

        // CPF
        if(tipoUsuarioAtual === "F"){
            const cpf = document.getElementById("cpf");
            if(cpf.getAttribute("data-valido") !== "true"){
                valido = false;
            }
        }

        // CNPJ
        if(tipoUsuarioAtual === "E"){
            const cnpj = document.getElementById("cnpj");
            if(cnpj.getAttribute("data-valido") !== "true"){
                valido = false;
            }
        }

        // Senha
        verificarPassword();
        if(
            senha.getAttribute("data-valido") !== "true" ||
            confirmar.getAttribute("data-valido") !== "true"
        ){
            valido = false;
        }

        // Mensagem Caso algo esteja Errado
        if(!valido){
            const mensagemGeral = document.getElementById("mensagem-geral");
            if(mensagemGeral){
                mensagemGeral.textContent = "Preencha todos os campos corretamente antes de avançar.";
            }
            return;
        }
    }

    else if(stepNumber === 3){

        let valido = true;

        const cep = document.getElementById("cep");
        const rua = document.getElementById("rua");
        const numero = document.getElementById("numero");
        const bairro = document.getElementById("bairro");
        const cidade = document.getElementById("cidade");
        const uf = document.getElementById("uf");
        const mensagemCep = document.getElementById("mensagem-cep");

        if(mensagemCep) mensagemCep.textContent = "";

        //Valida o CEP
        verificarCep();
        if(cep.getAttribute("data-valido") !== "true"){
            valido = false;
        }

        // Valida campos básicos de texto obrigatórios no HTML
        if(
            rua.value.trim() === "" ||
            numero.value.trim() === "" ||
            bairro.value.trim() === "" ||
            cidade.value.trim() === "" ||
            uf.value.trim() === ""
        ){
            valido = false;
        }

        // Caso falhe exibe o aviso
        if(!valido){
            if(mensagemCep){
                mensagemCep.textContent = "Preencha todos os campos de avançar.";
            }
            return;
        }
    }


    // Continua para a próxima etapa
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    const targetStep = document.getElementById("step" + stepNumber);

    if(targetStep){
        targetStep.classList.add("active");
    }
};

function verificarNome(){
    const nomeInput = document.getElementById("username");
    const mensagem = document.getElementById("mensagem-nome");

    if(!nomeInput || !mensagem) return;

    nomeInput.addEventListener("blur", () => {
        const nome = nomeInput.value.trim();

        if(nome === ""){
            mensagem.textContent = "Digite seu nome completo.";
            nomeInput.setAttribute("data-valido","false");
        }else{
            mensagem.textContent = "";
            nomeInput.setAttribute("data-valido","true");
        }
    });
}

function verificarIdade(){
    const nascimentoInput = document.getElementById("date-nascimento");
    const mensagem = document.getElementById("mensagem-birthday");

    if(!nascimentoInput || !mensagem) return;

    nascimentoInput.addEventListener("change", () => {
        const valor = nascimentoInput.value;

        if(!valor){
            mensagem.textContent = "";
            nascimentoInput.removeAttribute("data-valido");
            return;
        }

        const dataNascimento = new Date(valor + "T00:00:00");
        const hoje = new Date();

        if(isNaN(dataNascimento.getTime())){
            mensagem.textContent = "Data inválida.";
            nascimentoInput.setAttribute("data-valido","false");
            return;
        }

        hoje.setHours(0,0,0,0);

        if(dataNascimento >= hoje){
            mensagem.textContent = "Insira uma data válida.";
            nascimentoInput.setAttribute("data-valido","false");
            return;
        }

        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const mes = hoje.getMonth() - dataNascimento.getMonth();

        if(mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())){
            idade--;
        }

        if(idade < 16){
            mensagem.textContent = "Você precisa ter no mínimo 16 anos.";
            nascimentoInput.setAttribute("data-valido","false");
        }else{
            mensagem.textContent = "";
            nascimentoInput.setAttribute("data-valido","true");
        }
    });
}

function verificarDataEmpresa(){
    const criacaoInput = document.getElementById("date-criacao");
    const mensagem = document.getElementById("mensagem-criacao");

    if(!criacaoInput || !mensagem) return;

    criacaoInput.addEventListener("change", () => {
        const valor = criacaoInput.value;

        if(!valor){
            mensagem.textContent = "";
            criacaoInput.removeAttribute("data-valido");
            return;
        }

        const dataCriacao = new Date(valor + "T00:00:00");
        const hoje = new Date();

        hoje.setHours(0,0,0,0);

        if(isNaN(dataCriacao.getTime())){
            mensagem.textContent = "Data inválida.";
            criacaoInput.setAttribute("data-valido","false");
            return;
        }

        if(dataCriacao >= hoje){
            mensagem.textContent = "Insira uma data válida.";
            criacaoInput.setAttribute("data-valido","false");
            return;
        } else {
            mensagem.textContent = "";
            criacaoInput.setAttribute("data-valido","true");
        }
    });
}

function verificarEmail(){
    const emailInput = document.getElementById("email");
    const mensagem = document.getElementById("mensagem-email");

    if(!emailInput) return;

    if(emailInput.value.trim() === ""){
        emailInput.removeAttribute("data-valido");
        mensagem.textContent = "";
        return;
    }

    const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (padrao.test(emailInput.value)) {
        mensagem.textContent = "";
        emailInput.setAttribute("data-valido", "true");
        return true;
    } else {
        mensagem.textContent = "Email Inválido";
        emailInput.setAttribute("data-valido", "false");
        return false;
    }
}

function formatarPhone() {
    const phoneInput = document.getElementById("phone");
    const mensagem = document.getElementById("mensagem-phone");
    if (!phoneInput) return;

    let phone = phoneInput.value.replace(/\D/g, "");

    phone = phone.substring(0, 11);
    if (phone.length === 0) {
        mensagem.textContent = "";
        phoneInput.value = "";
        return;
    }
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
    if (phone.length === 0) {
        mensagem.textContent = "";
        phoneInput.value = "";
        phoneInput.removeAttribute("data-valido");
        return;
    }
    if(phone.length !== 11){
        mensagem.textContent = "Número de celular inválido.";
        phoneInput.setAttribute("data-valido", "false");
        return false;
    }

    if(phone.charAt(2) !== "9"){
        mensagem.textContent = "Número de celular inválido.";
        phoneInput.setAttribute("data-valido", "false");
        return false;
    }

    mensagem.textContent = "";
    phoneInput.setAttribute("data-valido", "true");

    return true;
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

        if(cpf.length === 0){
            cpfInput.removeAttribute("data-valido");
            mensagem.textContent = "";
            return;
        }

        if(cpf.length !== 11){
            cpfInput.removeAttribute("data-valido");
            mensagem.textContent = "CPF incompleto.";
            return;
        }

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
    });
}

function marcarCpfValido(input) {
    input.setAttribute("data-valido", "true");
    const mensagem = document.getElementById("mensagem-cpf");
    mensagem.textContent = "";
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
        let cnpj = event.target.value.replace(/\D/g,"");

        if(cnpj.length > 14){
            cnpj = cnpj.substring(0,14);
        }

        let valor = cnpj;
        valor = valor.replace(/^(\d{2})(\d)/,"$1.$2");
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d)/,".$1/$2");
        valor = valor.replace(/(\d{4})(\d)/,"$1-$2");

        event.target.value = valor;

        if(cnpj.length === 0){
            mensagem.textContent = "";
            cnpjInput.removeAttribute("data-valido");
            return;
        }

        if(cnpj.length < 14){
            mensagem.textContent = "CNPJ incompleto.";
            cnpjInput.removeAttribute("data-valido");
            return;
        }

        if(validarCNPJ(cnpj)){
            mensagem.textContent = "";
            cnpjInput.setAttribute("data-valido","true");
        }else{
            mensagem.textContent = "CNPJ Inválido.";
            cnpjInput.setAttribute("data-valido","false");
        }
    });
}

function validarCNPJ(cnpj){
    if(cnpj.length !== 14) return false;
    if(/^(\d)\1+$/.test(cnpj)) return false;

    let tamanho = 12;
    let numeros = cnpj.substring(0,tamanho);
    let digitos = cnpj.substring(tamanho);

    let soma = 0;
    let pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){
        soma += numeros.charAt(tamanho-i) * pos--;
        if(pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    if(resultado != digitos.charAt(0)){
        return false;
    }

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);

    soma = 0;
    pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){
        soma += numeros.charAt(tamanho-i) * pos--;
        if(pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    return resultado == digitos.charAt(1);
}

function verificarPassword() {
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");

    const mensagemSenha = document.getElementById("mensagem-password");
    const mensagemConfirm = document.getElementById("mensagem-confirm-password");

    const senha = passwordInput.value;
    const confirmar = confirmPasswordInput.value;

    if (senha.length === 0) {
        mensagemSenha.textContent = "Digite uma senha.";
        passwordInput.setAttribute("data-valido", "false");
    } else if (senha.length < 6) {
        mensagemSenha.textContent = "Sua senha deve conter no mínimo 6 dígitos.";
        passwordInput.setAttribute("data-valido", "false");
    } else {
        mensagemSenha.textContent = "";
        passwordInput.setAttribute("data-valido", "true");
    }

    if (confirmar.length === 0) {
        mensagemConfirm.textContent = "Confirme sua senha.";
        confirmPasswordInput.setAttribute("data-valido", "false");
    } else if (senha !== confirmar) {
        mensagemConfirm.textContent = "A confirmação de senha não confere.";
        confirmPasswordInput.setAttribute("data-valido", "false");
    } else {
        mensagemConfirm.textContent = "";
        confirmPasswordInput.setAttribute("data-valido", "true");
    }
}

function verificarSobre(){
    const sobreFreelancerInput = document.getElementById("sobre-freelancer");
    const sobreEmpresaInput = document.getElementById("sobre-empresa");

    const mensagemSobreFreelancer = document.getElementById("mensagem-sobre-freelancer");
    const mensagemSobreEmpresa = document.getElementById("mensagem-sobre-empresa");

    if(tipoUsuarioAtual === "F"){
        const sobre = sobreFreelancerInput.value;

        if(sobre.length === 0){
            mensagemSobreFreelancer.textContent = "Digite uma descrição.";
            sobreFreelancerInput.setAttribute("data-valido", "false");
        }else if(sobre.length < 50){
            mensagemSobreFreelancer.textContent = "Sua descrição deve conter no mínimo 50 caracteres.";
            sobreFreelancerInput.setAttribute("data-valido", "false");
        }else{
            mensagemSobreFreelancer.textContent = "";
            sobreFreelancerInput.setAttribute("data-valido", "true");
        }
    }else{
        const sobre = sobreEmpresaInput.value;

        if(sobre.length === 0){
            mensagemSobreEmpresa.textContent = "Digite uma descrição.";
            sobreEmpresaInput.setAttribute("data-valido", "false");
        }else if(sobre.length < 50){
            mensagemSobreEmpresa.textContent = "Sua descrição deve conter no mínimo 50 caracteres.";
            sobreEmpresaInput.setAttribute("data-valido", "false");
        }else{
            mensagemSobreEmpresa.textContent = "";
            sobreEmpresaInput.setAttribute("data-valido", "true");
        }
    }
}

function verificarCep() {
    const cepInput = document.getElementById("cep");
    const mensagem = document.getElementById("mensagem-cep");
    

    if (!cepInput) return;

    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length === 0) {
        mensagem.textContent = "";
        cepInput.removeAttribute("data-valido");
        return;
    }

    mensagem.textContent = "";
    cepInput.setAttribute("data-valido", "true");
}

function verificarTags() {
    const tagsInputs = document.querySelectorAll('input[name="tags"]');
    const mensagem = document.getElementById("mensagem-tag");
    const containerTags = document.querySelector('.tags-buttons');

    if (!tagsInputs.length) return false;

    const tagSelecionada = document.querySelector('input[name="tags"]:checked');

    if (!tagSelecionada) {
        mensagem.textContent = "Selecione ao menos uma tag para continuar.";
        containerTags.setAttribute("data-valido", "false");
        return false;
    }

    mensagem.textContent = "";
    containerTags.setAttribute("data-valido", "true");
    return true;
}