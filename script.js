const OPENROUTER_API_KEY = "Adicionar a key aqui";
const ELEVEN_API_KEY = "sk_374764a08df412ec177a74d9055bc553002d4db133cfbf03";
const textoParte = "Olá, eu sou o assistente de Alec Vinícius e Duda Pacheco, irei falar um pouco sobre o gamma. O Gamma é uma ferramenta moderna de criação de apresentações e documentos interativos, que une a simplicidade de um editor de texto com o impacto visual de um PowerPoint. Diferente das ferramentas tradicionais, o Gamma utiliza inteligência artificial para ajudar na criação de conteúdos dinâmicos, visualmente atraentes e fáceis de compartilhar. É como se fosse uma mistura entre Google Slides, Canva e Notion, mas com foco em produtividade e colaboração. ";

let falaAtual = null;
let vozes = [];
let audioElevenAtual = null;

// Atualização das vozes
window.speechSynthesis.onvoiceschanged = () => {
  vozes = window.speechSynthesis.getVoices();
};

// Cancela a fala da IA 
function cancelarFala() {
  return new Promise(resolve => {
    window.speechSynthesis.cancel();
    setTimeout(resolve, 150);
  });
}

// Modelo 3D
function mostrarFalando() {
  const falando = document.querySelector('.Falando');
  const esperando = document.querySelector('.Esperando');

  falando.classList.add('ativo');
  esperando.classList.remove('ativo');
}

function mostrarEsperando() {
  const falando = document.querySelector('.Falando');
  const esperando = document.querySelector('.Esperando');

  esperando.classList.add('ativo');
  falando.classList.remove('ativo');
}


// Fala com a voz selecionada
async function falarTexto(texto) {
  const vozEscolhida = document.getElementById("voz-select").value;

  if (vozEscolhida === "google") {
    await falarComVozGoogle(texto, "Google português do Brasil");
  } else if (vozEscolhida === "eleven") {
    await gerarAudioEleven(texto);
  }
}


// Abre as opções das vozes
document.getElementById("btn-voz").addEventListener("click", () => {
  const menu = document.getElementById("voz-opcoes");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});

// Fecha as opções
window.addEventListener("click", function(event) {
  if (!event.target.matches('.botao-mais')) {
    document.getElementById("voz-opcoes");
  }
});

// Selecionar voz ao clicar 
document.querySelectorAll("#voz-opcoes div").forEach(opcao => {
  opcao.addEventListener("click", () => {
    const valorSelecionado = opcao.getAttribute("data-voz");
    document.getElementById("voz-select").value = valorSelecionado;

    document.getElementById("btn-voz").textContent = opcao.textContent[0];
  });
});

// Função que fala com voz do SpeechSynthesis 
async function falarComVozGoogle(texto, nomeVoz) {
  await cancelarFala();

  return new Promise(resolve => {
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';

    let vozSelecionada = vozes.find(voz => voz.name.includes(nomeVoz));
    fala.voice = vozSelecionada;

    mostrarFalando(); 

    falaAtual = fala;
    fala.onend = () => {
      mostrarEsperando(); 
      resolve();
    };
    fala.onerror = () => {
      mostrarEsperando();
      resolve();
    };

    window.speechSynthesis.speak(fala);
  });
}


// Essa parte controla a fala da IA, a parte dela do projeto
async function falarParte() {
  if (window.speechSynthesis.speaking) {
    await cancelarFala();
    document.getElementById("status").innerText = "Fala interrompida.";
  } else {
    document.getElementById("status").innerText = "Falando sua parte do projeto...";
    await falarTexto(textoParte);
    document.getElementById("status").innerText = "Pronto!";
  }
}

// para ouvir e responder
function modoPergunta() {
  cancelarFala();

  document.getElementById("status").innerText = "Escutando pergunta...";

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'pt-BR';
  recognition.start();

  recognition.onresult = async function(event) {
    const pergunta = event.results[0][0].transcript;
    document.getElementById("status").innerText = "Pergunta recebida: " + pergunta;

    const resposta = await buscarResposta(pergunta);
    await falarTexto(resposta);
    document.getElementById("status").innerText = "Resposta: " + resposta;
  };

  recognition.onerror = function() {
    document.getElementById("status").innerText = "Erro ao escutar. Tente novamente.";
  }
}

// API da IA para responder perguntas
async function buscarResposta(pergunta) {
  try {
    const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "jarviskey",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "Responda de forma curta, clara e objetiva."
          },
          {
            role: "user",
            content: pergunta
          }
        ],
        temperature: 0.5,
      })
    });

    if (!resposta.ok) {
      throw new Error(`Erro: ${resposta.status} ${resposta.statusText}`);
    }

    const data = await resposta.json();
    return data.choices[0].message.content.trim();
  } catch (erro) {
    console.error("Erro ao buscar resposta:", erro);
    return "Desculpe, não consegui responder agora.";
  }
}


// Pergunta digitada
document.getElementById("btn-pergunta").addEventListener("click", async function() {
  const perguntaDigitada = document.getElementById("caixa-pergunta").value.trim();
  if (perguntaDigitada === "") {
    document.getElementById("status").innerText = "Por favor, digite uma pergunta.";
    return;
  }

  document.getElementById("status").innerText = "Pergunta digitada: " + perguntaDigitada;

  const resposta = await buscarResposta(perguntaDigitada);
  await falarTexto(resposta);
  document.getElementById("status").innerText = "Resposta: " + resposta;
});


// Voz feminina do Elevenlabs
async function gerarAudioEleven(texto) {
  if (audioElevenAtual) {
    audioElevenAtual.pause();
    audioElevenAtual = null;
  }

  const resposta = await fetch("https://api.elevenlabs.io/v1/text-to-speech/XJa38TJgDqYhj5mYbSJA", {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: texto,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  const blob = await resposta.blob();
  audioElevenAtual = new Audio(URL.createObjectURL(blob));

  mostrarFalando(); 

  return new Promise(resolve => {
    audioElevenAtual.onended = () => {
      mostrarEsperando(); 
      resolve();
    };
    audioElevenAtual.onerror = () => {
      mostrarEsperando();
      resolve();
    };
    audioElevenAtual.play();
  });
}

// CAIXA DE TEXTO
const textarea = document.getElementById("caixa-pergunta");

textarea.addEventListener("input", () => {
  const maxRows = 4;
  const lineHeight = 24; 
  const lines = textarea.value.split("\n").length;

  if (lines > maxRows) {
    textarea.style.overflowY = "scroll";
    textarea.rows = maxRows;
    textarea.style.height = `${lineHeight * maxRows}px`;
  } else {
    textarea.style.overflowY = "hidden";
    textarea.rows = lines;
    textarea.style.height = `${lineHeight * lines}px`;
  }
});


