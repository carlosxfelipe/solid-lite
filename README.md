# Solid Lite

Uma implementação minimalista do motor de reatividade do SolidJS rodando nativamente sobre Deno. O projeto demonstra como criar uma arquitetura de Single Page Application (SPA) com reatividade granular utilizando o DOM real, sem a necessidade de um compilador complexo.

## Características Técnicas

- Reatividade fina: Utiliza signals e effects para atualizações cirúrgicas no DOM real.
- Runtime JSX: Processamento de interface via função HyperScript (h) em tempo de execução.
- Sem links virtuais: Diferente do React, as mudanças são aplicadas diretamente aos nós do navegador.
- Deno nativo: Construído para aproveitar a performance e as APIs de segurança do Deno.

## Requisitos

- Deno instalado no sistema.

## Como Executar

O projeto utiliza o sistema de tarefas do Deno para automação.

### Iniciar Aplicação
Para limpar o build anterior, compilar os arquivos e iniciar o servidor de visualização:
```bash
deno task start
```

### Apenas Compilação
Para gerar os arquivos na pasta dist sem iniciar o servidor:
```bash
deno task build
```

### Desenvolvimento (Sem Limpeza)
Para compilar e visualizar rapidamente:
```bash
deno task dev
```

### Estrutura de Pastas
- /solid: Núcleo da lógica de reatividade e runtime.
- /src: Código fonte da aplicação (componentes, páginas, estilos).
- /scripts: Ferramentas auxiliares de automação e servidor local.
- /public: Arquivos estáticos legados.
