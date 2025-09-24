let proventos = JSON.parse(localStorage.getItem('proventos')) || [];
        let charts = {};
        
        // Elementos do formulário
        const form = document.getElementById('proventoForm');
        const quantidadeInput = document.getElementById('quantidade');
        const valorUnitarioInput = document.getElementById('valorUnitario');
        const valorBrutoInput = document.getElementById('valorBruto');
        const impostosInput = document.getElementById('impostos');
        const valorLiquidoInput = document.getElementById('valorLiquido');
        
        // Calcular valores automaticamente
        function calcularValores() {
            const quantidade = parseFloat(quantidadeInput.value) || 0;
            const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
            const impostos = parseFloat(impostosInput.value) || 0;
            
            const valorBruto = quantidade * valorUnitario;
            const valorLiquido = valorBruto - impostos;
            
            valorBrutoInput.value = valorBruto.toFixed(2);
            valorLiquidoInput.value = valorLiquido.toFixed(2);
        }
        
        quantidadeInput.addEventListener('input', calcularValores);
        valorUnitarioInput.addEventListener('input', calcularValores);
        impostosInput.addEventListener('input', calcularValores);
        
        // Submeter formulário
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const provento = {
                id: Date.now(),
                data: document.getElementById('data').value,
                ativo: document.getElementById('ativo').value.toUpperCase(),
                tipo: document.getElementById('tipo').value,
                tipoProvento: document.getElementById('tipoProvento').value,
                quantidade: parseInt(document.getElementById('quantidade').value),
                valorUnitario: parseFloat(document.getElementById('valorUnitario').value),
                valorBruto: parseFloat(document.getElementById('valorBruto').value),
                impostos: parseFloat(document.getElementById('impostos').value),
                valorLiquido: parseFloat(document.getElementById('valorLiquido').value)
            };
            
            proventos.push(provento);
            localStorage.setItem('proventos', JSON.stringify(proventos));
            
            form.reset();
            atualizarTabela();
            atualizarDashboard();
            atualizarFiltros();
            
            alert('Provento adicionado com sucesso!');
        });
        
        // Funções de interface
        function openTab(evt, tabName) {
            const tabcontents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabcontents.length; i++) {
                tabcontents[i].classList.remove('active');
            }
            
            const tabs = document.getElementsByClassName('tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            
            document.getElementById(tabName).classList.add('active');
            evt.currentTarget.classList.add('active');
            
            if (tabName === 'dashboard') {
                setTimeout(() => atualizarDashboard(), 100);
            }
            if (tabName === 'relatorios') {
                atualizarRelatorio();
            }
        }
        
        function atualizarTabela() {
            const tbody = document.querySelector('#proventosTable tbody');
            tbody.innerHTML = '';
            
            proventos.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(provento => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(provento.data).toLocaleDateString('pt-BR')}</td>
                    <td>${provento.ativo}</td>
                    <td>${provento.tipo}</td>
                    <td>${provento.tipoProvento}</td>
                    <td>${provento.quantidade.toLocaleString('pt-BR')}</td>
                    <td>R$ ${provento.valorUnitario.toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${provento.valorBruto.toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${provento.impostos.toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${provento.valorLiquido.toFixed(2).replace('.', ',')}</td>
                    <td><button class="delete-btn" onclick="deletarProvento(${provento.id})">🗑️</button></td>
                `;
            });
        }
        
        function deletarProvento(id) {
            if (confirm('Tem certeza que deseja excluir este provento?')) {
                proventos = proventos.filter(p => p.id !== id);
                localStorage.setItem('proventos', JSON.stringify(proventos));
                atualizarTabela();
                atualizarDashboard();
                atualizarFiltros();
            }
        }
        
        function atualizarDashboard() {
            // Atualizar KPIs
            const total = proventos.reduce((sum, p) => sum + p.valorLiquido, 0);
            const anoAtual = new Date().getFullYear();
            const mesAtual = new Date().getMonth();
            
            const proventosAnoAtual = proventos.filter(p => new Date(p.data).getFullYear() === anoAtual)
                .reduce((sum, p) => sum + p.valorLiquido, 0);
                
            const proventosMesAtual = proventos.filter(p => {
                const data = new Date(p.data);
                return data.getFullYear() === anoAtual && data.getMonth() === mesAtual;
            }).reduce((sum, p) => sum + p.valorLiquido, 0);
            
            const mesesComProventos = [...new Set(proventos.map(p => {
                const data = new Date(p.data);
                return `${data.getFullYear()}-${data.getMonth()}`;
            }))].length;
            
            const media = mesesComProventos > 0 ? total / mesesComProventos : 0;
            
            document.getElementById('totalProventos').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            document.getElementById('proventosAno').textContent = `R$ ${proventosAnoAtual.toFixed(2).replace('.', ',')}`;
            document.getElementById('proventosMes').textContent = `R$ ${proventosMesAtual.toFixed(2).replace('.', ',')}`;
            document.getElementById('mediaProventos').textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
            
            // Atualizar gráficos
            atualizarGraficos();
        }
        
        function atualizarGraficos() {
            // Gráfico mensal
            const dadosMensais = {};
            proventos.forEach(p => {
                const data = new Date(p.data);
                const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
                dadosMensais[chave] = (dadosMensais[chave] || 0) + p.valorLiquido;
            });
            
            const meses = Object.keys(dadosMensais).sort();
            const valoresMensais = meses.map(m => dadosMensais[m]);
            
            if (charts.mensal) charts.mensal.destroy();
            charts.mensal = new Chart(document.getElementById('chartMensal'), {
                type: 'line',
                data: {
                    labels: meses.map(m => {
                        const [ano, mes] = m.split('-');
                        return `${mes}/${ano}`;
                    }),
                    datasets: [{
                        label: 'Proventos (R$)',
                        data: valoresMensais,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
            
            // Gráfico por tipo
            const dadosTipo = {};
            proventos.forEach(p => {
                dadosTipo[p.tipo] = (dadosTipo[p.tipo] || 0) + p.valorLiquido;
            });
            
            if (charts.tipo) charts.tipo.destroy();
            charts.tipo = new Chart(document.getElementById('chartTipo'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(dadosTipo),
                    datasets: [{
                        data: Object.values(dadosTipo),
                        backgroundColor: ['#3498db', '#e74c3c', '#f39c12', '#27ae60']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            // Gráfico por ativos (Top 10)
            const dadosAtivos = {};
            proventos.forEach(p => {
                dadosAtivos[p.ativo] = (dadosAtivos[p.ativo] || 0) + p.valorLiquido;
            });
            
            const topAtivos = Object.entries(dadosAtivos)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
            
            if (charts.ativos) charts.ativos.destroy();
            charts.ativos = new Chart(document.getElementById('chartAtivos'), {
                type: 'bar',
                data: {
                    labels: topAtivos.map(([ativo]) => ativo),
                    datasets: [{
                        label: 'Proventos (R$)',
                        data: topAtivos.map(([, valor]) => valor),
                        backgroundColor: '#27ae60'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
            
            // Gráfico anual
            const dadosAnuais = {};
            proventos.forEach(p => {
                const ano = new Date(p.data).getFullYear();
                                dadosAnuais[ano] = (dadosAnuais[ano] || 0) + p.valorLiquido;
            });

            const anos = Object.keys(dadosAnuais).sort();
            const valoresAnuais = anos.map(a => dadosAnuais[a]);

            if (charts.anual) charts.anual.destroy();
            charts.anual = new Chart(document.getElementById('chartAnual'), {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [{
                        label: 'Proventos Anuais (R$)',
                        data: valoresAnuais,
                        borderColor: '#e67e22',
                        backgroundColor: 'rgba(230, 126, 34, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Filtros Relatórios
        function atualizarFiltros() {
            const filtroAno = document.getElementById('filtroAno');
            const filtroAtivo = document.getElementById('filtroAtivo');

            // Atualizar anos
            const anos = [...new Set(proventos.map(p => new Date(p.data).getFullYear()))].sort((a, b) => b - a);
            filtroAno.innerHTML = '<option value="">Todos os anos</option>' + anos.map(a => `<option value="${a}">${a}</option>`).join('');

            // Atualizar ativos
            const ativos = [...new Set(proventos.map(p => p.ativo))].sort();
            filtroAtivo.innerHTML = '<option value="">Todos os ativos</option>' + ativos.map(a => `<option value="${a}">${a}</option>`).join('');
        }

        function aplicarFiltros() {
            const ano = document.getElementById('filtroAno').value;
            const tipo = document.getElementById('filtroTipo').value;
            const ativo = document.getElementById('filtroAtivo').value;

            const tbody = document.querySelector('#relatorioTable tbody');
            tbody.innerHTML = '';

            proventos
                .filter(p => (!ano || new Date(p.data).getFullYear() == ano) &&
                             (!tipo || p.tipo == tipo) &&
                             (!ativo || p.ativo == ativo))
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .forEach(p => {
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${new Date(p.data).toLocaleDateString('pt-BR')}</td>
                        <td>${p.ativo}</td>
                        <td>${p.tipo}</td>
                        <td>${p.tipoProvento}</td>
                        <td>R$ ${p.valorLiquido.toFixed(2).replace('.', ',')}</td>
                    `;
                });
        }

        function limparFiltros() {
            document.getElementById('filtroAno').value = '';
            document.getElementById('filtroTipo').value = '';
            document.getElementById('filtroAtivo').value = '';
            aplicarFiltros();
        }

        function atualizarRelatorio() {
            aplicarFiltros();
            atualizarFiltros();
        }

        // Exportar/Importar Excel
        function exportarExcel() {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(proventos.map(p => ({
                Data: p.data,
                Ativo: p.ativo,
                Tipo: p.tipo,
                Provento: p.tipoProvento,
                Quantidade: p.quantidade,
                ValorUnitario: p.valorUnitario,
                ValorBruto: p.valorBruto,
                Impostos: p.impostos,
                ValorLiquido: p.valorLiquido
            })));
            XLSX.utils.book_append_sheet(wb, ws, "Proventos");
            XLSX.writeFile(wb, "proventos.xlsx");
        }

        function importarExcel() {
            const file = document.getElementById('fileInput').files[0];
            if (!file) return alert('Selecione um arquivo para importar.');

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws);

                json.forEach(p => {
                    proventos.push({
                        id: Date.now() + Math.random(),
                        data: p.Data,
                        ativo: p.Ativo,
                        tipo: p.Tipo,
                        tipoProvento: p.Provento,
                        quantidade: parseInt(p.Quantidade),
                        valorUnitario: parseFloat(p.ValorUnitario),
                        valorBruto: parseFloat(p.ValorBruto),
                        impostos: parseFloat(p.Impostos),
                        valorLiquido: parseFloat(p.ValorLiquido)
                    });
                });

                localStorage.setItem('proventos', JSON.stringify(proventos));
                atualizarTabela();
                atualizarDashboard();
                atualizarFiltros();
                alert('Dados importados com sucesso!');
            };
            reader.readAsArrayBuffer(file);
        }

        // Inicialização
        atualizarTabela();
        atualizarDashboard();
        atualizarFiltros();