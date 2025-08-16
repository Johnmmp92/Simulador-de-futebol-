

import { BuffType, BuffInfo, TeamInfo, BallDefinition } from './types';

export const FIELD_WIDTH = 1000;
export const FIELD_HEIGHT = 600;
export const PLAYER_RADIUS = 25;
export const BALL_RADIUS = 15;
export const NUM_PLAYERS_PER_TEAM = 11;

export const DEFAULT_MIN_PLAYER_SPEED = 1;
export const DEFAULT_MAX_PLAYER_SPEED = 4;
export const DEFAULT_TACKLE_DISTANCE = 150;

export const GOAL_HEIGHT = 180;
export const GOAL_DEPTH = 20;

const teamData: Record<string, TeamInfo[]> = {
  "Seleções Nacionais": [
    { id: 'argentina', name: 'Argentina', foundationDate: '1893', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/argentina.svg', color: '#75AADB', color2: '#FFFFFF', ratings: { attack: 94, defense: 86, midfield: 91, form: 93, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'brasil', name: 'Brasil', foundationDate: '1914', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/brasil.svg', color: '#FFDC00', color2: '#009739', ratings: { attack: 92, defense: 88, midfield: 90, form: 89, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'franca', name: 'França', foundationDate: '1919', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/franca.svg', color: '#0055A4', color2: '#FFFFFF', ratings: { attack: 95, defense: 89, midfield: 93, form: 92, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'inglaterra', name: 'Inglaterra', foundationDate: '1863', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/inglaterra.svg', color: '#FFFFFF', color2: '#CF081F', ratings: { attack: 91, defense: 87, midfield: 92, form: 90, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'espanha', name: 'Espanha', foundationDate: '1909', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/espanha.svg', color: '#AA151B', color2: '#FABD00', ratings: { attack: 89, defense: 86, midfield: 94, form: 91, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'alemanha', name: 'Alemanha', foundationDate: '1900', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/alemanha.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 90, defense: 85, midfield: 89, form: 85, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'portugal', name: 'Portugal', foundationDate: '1914', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/portugal.svg', color: '#DA291C', color2: '#006233', ratings: { attack: 92, defense: 86, midfield: 90, form: 88, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'holanda', name: 'Holanda', foundationDate: '1889', logo: 'https://s.sde.globo.com/media/organizations/2020/10/29/escudo-holanda-2020.svg', color: '#F36C21', color2: '#FFFFFF', ratings: { attack: 88, defense: 87, midfield: 88, form: 87, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'italia', name: 'Itália', foundationDate: '1898', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/italia.svg', color: '#0068A8', color2: '#FFFFFF', ratings: { attack: 87, defense: 92, midfield: 88, form: 86, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'belgica', name: 'Bélgica', foundationDate: '1895', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/belgica.svg', color: '#ED2939', color2: '#FAE042', ratings: { attack: 90, defense: 85, midfield: 89, form: 84, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'croacia', name: 'Croácia', foundationDate: '1912', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/croacia.svg', color: '#FF0000', color2: '#FFFFFF', ratings: { attack: 86, defense: 84, midfield: 91, form: 88, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'uruguai', name: 'Uruguai', foundationDate: '1900', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/uruguai.svg', color: '#55B5E5', color2: '#FFFFFF', ratings: { attack: 88, defense: 85, midfield: 86, form: 87, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'colombia', name: 'Colômbia', foundationDate: '1924', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/colombia.svg', color: '#FCD116', color2: '#003893', ratings: { attack: 85, defense: 81, midfield: 84, form: 86, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'japao', name: 'Japão', foundationDate: '1921', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/japao.svg', color: '#000080', color2: '#FFFFFF', ratings: { attack: 83, defense: 80, midfield: 85, form: 88, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'marrocos', name: 'Marrocos', foundationDate: '1955', logo: 'https://s.sde.globo.com/media/organizations/2022/11/22/MAR.svg', color: '#C1272D', color2: '#006233', ratings: { attack: 84, defense: 88, midfield: 86, form: 89, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'eua', name: 'EUA', foundationDate: '1913', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/estados_unidos.svg', color: '#002868', color2: '#BF0A30', ratings: { attack: 82, defense: 81, midfield: 83, form: 84, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'mexico', name: 'México', foundationDate: '1922', logo: 'https://s.sde.globo.com/media/organizations/2021/11/30/novo-escudo-mexico.svg', color: '#006847', color2: '#FFFFFF', ratings: { attack: 84, defense: 80, midfield: 83, form: 82, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'suica', name: 'Suíça', foundationDate: '1895', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/suica.svg', color: '#FF0000', color2: '#FFFFFF', ratings: { attack: 81, defense: 84, midfield: 83, form: 85, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'dinamarca', name: 'Dinamarca', foundationDate: '1889', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/dinamarca.svg', color: '#C60C30', color2: '#FFFFFF', ratings: { attack: 84, defense: 83, midfield: 85, form: 83, momentum: 75 }, category: 'Seleções Nacionais' },
    { id: 'senegal', name: 'Senegal', foundationDate: '1960', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/senegal.svg', color: '#00853F', color2: '#FDEF42', ratings: { attack: 85, defense: 82, midfield: 83, form: 86, momentum: 75 }, category: 'Seleções Nacionais' },
  ],
  "Brasileirão Série A": [
    { id: 'athletico-pr', name: 'Athletico-PR', foundationDate: '1924', logo: 'https://s.sde.globo.com/media/organizations/2019/09/09/Athletico-PR.svg', color: '#C80000', color2: '#000000', ratings: { attack: 83, defense: 79, midfield: 81, form: 84, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'atletico-go', name: 'Atlético-GO', foundationDate: '1937', logo: 'https://s.sde.globo.com/media/organizations/2020/07/02/atletico-go-2020.svg', color: '#FF0000', color2: '#000000', ratings: { attack: 76, defense: 74, midfield: 75, form: 78, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'atletico-mg', name: 'Atlético-MG', foundationDate: '1908', logo: 'https://s.sde.globo.com/media/organizations/2018/03/10/atletico-mg.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 86, defense: 82, midfield: 84, form: 83, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'bahia', name: 'Bahia', foundationDate: '1931', logo: 'https://s.sde.globo.com/media/organizations/2018/03/11/bahia.svg', color: '#0074C4', color2: '#FFFFFF', ratings: { attack: 80, defense: 77, midfield: 79, form: 85, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'botafogo', name: 'Botafogo', foundationDate: '1904', logo: 'https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-svg.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 85, defense: 80, midfield: 82, form: 86, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'bragantino', name: 'Bragantino', foundationDate: '1928', logo: 'https://s.sde.globo.com/media/organizations/2020/01/01/red-bull-bragantino-svg.svg', color: '#FFFFFF', color2: '#E30613', ratings: { attack: 82, defense: 78, midfield: 83, form: 83, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'corinthians', name: 'Corinthians', foundationDate: '1910', logo: 'https://s.sde.globo.com/media/organizations/2019/09/01/Corinthians.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 80, defense: 81, midfield: 82, form: 78, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'criciuma', name: 'Criciúma', foundationDate: '1947', logo: 'https://s.sde.globo.com/media/organizations/2018/03/11/criciuma.svg', color: '#FDD116', color2: '#000000', ratings: { attack: 74, defense: 75, midfield: 74, form: 79, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'cruzeiro', name: 'Cruzeiro', foundationDate: '1921', logo: 'https://s.sde.globo.com/media/organizations/2021/02/19/cruzeiro-2021.svg', color: '#003A94', color2: '#FFFFFF', ratings: { attack: 78, defense: 82, midfield: 79, form: 79, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'cuiaba', name: 'Cuiabá', foundationDate: '2001', logo: 'https://s.sde.globo.com/media/organizations/2020/08/23/cuiaba-2020-.svg', color: '#00853E', color2: '#FFDD00', ratings: { attack: 75, defense: 77, midfield: 75, form: 75, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'flamengo', name: 'Flamengo', foundationDate: '1895', logo: 'https://s.sde.globo.com/media/organizations/2019/07/11/Flamengo-2018.svg', color: '#D32F2F', color2: '#FFFFFF', ratings: { attack: 90, defense: 85, midfield: 88, form: 87, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'fluminense', name: 'Fluminense', foundationDate: '1902', logo: 'https://s.sde.globo.com/media/organizations/2018/03/11/fluminense.svg', color: '#7A0025', color2: '#006634', ratings: { attack: 84, defense: 79, midfield: 85, form: 80, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'fortaleza', name: 'Fortaleza', foundationDate: '1918', logo: 'https://s.sde.globo.com/media/organizations/2021/09/19/Fortaleza-2021.svg', color: '#0054A6', color2: '#C40202', ratings: { attack: 79, defense: 78, midfield: 80, form: 80, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'gremio', name: 'Grêmio', foundationDate: '1903', logo: 'https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg', color: '#0D80BF', color2: '#000000', ratings: { attack: 81, defense: 78, midfield: 80, form: 77, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'internacional', name: 'Internacional', foundationDate: '1909', logo: 'https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg', color: '#FF0000', color2: '#FFFFFF', ratings: { attack: 82, defense: 80, midfield: 81, form: 81, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'juventude', name: 'Juventude', foundationDate: '1913', logo: 'https://s.sde.globo.com/media/organizations/2021/04/29/juventude-2021.svg', color: '#00963C', color2: '#FFFFFF', ratings: { attack: 75, defense: 76, midfield: 75, form: 77, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'palmeiras', name: 'Palmeiras', foundationDate: '1914', logo: 'https://s.sde.globo.com/media/organizations/2014/04/14/palmeiras.svg', color: '#006437', color2: '#FFFFFF', ratings: { attack: 88, defense: 87, midfield: 86, form: 90, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'sao-paulo', name: 'São Paulo', foundationDate: '1930', logo: 'https://s.sde.globo.com/media/organizations/2019/09/20/sao-paulo.svg', color: '#FFFFFF', color2: '#FF0000', ratings: { attack: 83, defense: 84, midfield: 83, form: 82, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'vasco', name: 'Vasco', foundationDate: '1898', logo: 'https://s.sde.globo.com/media/organizations/2021/09/04/vasco-2021.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 78, defense: 77, midfield: 78, form: 76, momentum: 75 }, category: 'Brasileirão Série A' },
    { id: 'vitoria', name: 'Vitória', foundationDate: '1899', logo: 'https://s.sde.globo.com/media/organizations/2018/03/11/vitoria.svg', color: '#FF0000', color2: '#000000', ratings: { attack: 76, defense: 74, midfield: 76, form: 78, momentum: 75 }, category: 'Brasileirão Série A' },
  ],
  "Premier League (Inglaterra)": [
    { id: 'man-city', name: 'Man City', foundationDate: '1880', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/manchester_city.svg', color: '#6CABDD', color2: '#FFFFFF', ratings: { attack: 95, defense: 89, midfield: 94, form: 92, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'arsenal', name: 'Arsenal', foundationDate: '1886', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/arsenal.svg', color: '#EF0107', color2: '#FFFFFF', ratings: { attack: 91, defense: 87, midfield: 90, form: 91, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'liverpool', name: 'Liverpool', foundationDate: '1892', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/liverpool.svg', color: '#C8102E', color2: '#FFFFFF', ratings: { attack: 92, defense: 88, midfield: 89, form: 88, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'man-united', name: 'Man United', foundationDate: '1878', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/manchester_united.svg', color: '#DA291C', color2: '#FBE122', ratings: { attack: 88, defense: 84, midfield: 87, form: 83, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'chelsea', name: 'Chelsea', foundationDate: '1905', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/chelsea.svg', color: '#034694', color2: '#FFFFFF', ratings: { attack: 86, defense: 85, midfield: 86, form: 84, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'tottenham', name: 'Tottenham', foundationDate: '1882', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/tottenham.svg', color: '#FFFFFF', color2: '#132257', ratings: { attack: 87, defense: 83, midfield: 85, form: 85, momentum: 75 }, category: 'Premier League (Inglaterra)' },
    { id: 'newcastle', name: 'Newcastle', foundationDate: '1892', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/newcastle.svg', color: '#000000', color2: '#FFFFFF', ratings: { attack: 84, defense: 82, midfield: 83, form: 82, momentum: 75 }, category: 'Premier League (Inglaterra)' },
  ],
  "La Liga (Espanha)": [
    { id: 'real-madrid', name: 'Real Madrid', foundationDate: '1902', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/real_madrid_200.svg', color: '#FFFFFF', color2: '#FEBE10', ratings: { attack: 94, defense: 90, midfield: 95, form: 93, momentum: 75 }, category: 'La Liga (Espanha)' },
    { id: 'barcelona', name: 'Barcelona', foundationDate: '1899', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/barcelona.svg', color: '#A50044', color2: '#004D98', ratings: { attack: 90, defense: 85, midfield: 88, form: 86, momentum: 75 }, category: 'La Liga (Espanha)' },
    { id: 'atletico-madrid', name: 'Atlético de Madrid', foundationDate: '1903', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/atletico_de_madrid.svg', color: '#CB3524', color2: '#272E61', ratings: { attack: 87, defense: 91, midfield: 87, form: 88, momentum: 75 }, category: 'La Liga (Espanha)' },
    { id: 'sevilla', name: 'Sevilla', foundationDate: '1890', logo: 'https://s.sde.globo.com/media/organizations/2021/07/01/sevilla-2021.svg', color: '#D41B22', color2: '#FFFFFF', ratings: { attack: 84, defense: 83, midfield: 84, form: 81, momentum: 75 }, category: 'La Liga (Espanha)' },
    { id: 'real-sociedad', name: 'Real Sociedad', foundationDate: '1909', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/real_sociedad.svg', color: '#0067B1', color2: '#FFFFFF', ratings: { attack: 83, defense: 82, midfield: 85, form: 84, momentum: 75 }, category: 'La Liga (Espanha)' },
  ],
  "Serie A (Itália)": [
    { id: 'inter-milan', name: 'Inter Milan', foundationDate: '1908', logo: 'https://s.sde.globo.com/media/organizations/2021/03/30/inter-milao-2021.svg', color: '#0068A8', color2: '#000000', ratings: { attack: 90, defense: 90, midfield: 88, form: 89, momentum: 75 }, category: 'Serie A (Itália)' },
    { id: 'ac-milan', name: 'AC Milan', foundationDate: '1899', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/milan.svg', color: '#FB090B', color2: '#000000', ratings: { attack: 88, defense: 84, midfield: 87, form: 87, momentum: 75 }, category: 'Serie A (Itália)' },
    { id: 'juventus', name: 'Juventus', foundationDate: '1897', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/juventus.svg', color: '#FFFFFF', color2: '#000000', ratings: { attack: 87, defense: 88, midfield: 86, form: 85, momentum: 75 }, category: 'Serie A (Itália)' },
    { id: 'napoli', name: 'Napoli', foundationDate: '1926', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/napoli.svg', color: '#12A0D7', color2: '#FFFFFF', ratings: { attack: 89, defense: 83, midfield: 86, form: 84, momentum: 75 }, category: 'Serie A (Itália)' },
    { id: 'roma', name: 'Roma', foundationDate: '1927', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/roma.svg', color: '#8E1F2F', color2: '#F0B41C', ratings: { attack: 85, defense: 82, midfield: 84, form: 86, momentum: 75 }, category: 'Serie A (Itália)' },
    { id: 'lazio', name: 'Lazio', foundationDate: '1900', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/lazio.svg', color: '#87D8F7', color2: '#FFFFFF', ratings: { attack: 86, defense: 83, midfield: 85, form: 83, momentum: 75 }, category: 'Serie A (Itália)' },
  ],
  "Bundesliga (Alemanha)": [
    { id: 'bayern-munich', name: 'Bayern Munich', foundationDate: '1900', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/bayern_de_munique.svg', color: '#DC052D', color2: '#FFFFFF', ratings: { attack: 93, defense: 87, midfield: 92, form: 90, momentum: 75 }, category: 'Bundesliga (Alemanha)' },
    { id: 'dortmund', name: 'Borussia Dortmund', foundationDate: '1909', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/borussia_dortmund.svg', color: '#FDE100', color2: '#000000', ratings: { attack: 88, defense: 83, midfield: 86, form: 86, momentum: 75 }, category: 'Bundesliga (Alemanha)' },
    { id: 'leverkusen', name: 'Bayer Leverkusen', foundationDate: '1904', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/bayer_leverkusen.svg', color: '#E32221', color2: '#000000', ratings: { attack: 89, defense: 85, midfield: 88, form: 94, momentum: 75 }, category: 'Bundesliga (Alemanha)' },
    { id: 'rb-leipzig', name: 'RB Leipzig', foundationDate: '2009', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/rb_leipzig.svg', color: '#FFFFFF', color2: '#DA1F26', ratings: { attack: 87, defense: 84, midfield: 86, form: 85, momentum: 75 }, category: 'Bundesliga (Alemanha)' },
  ],
  "Ligue 1 (França)": [
    { id: 'psg', name: 'PSG', foundationDate: '1970', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/paris_saint_germain.svg', color: '#004171', color2: '#DA291C', ratings: { attack: 92, defense: 86, midfield: 89, form: 89, momentum: 75 }, category: 'Ligue 1 (França)' },
    { id: 'monaco', name: 'AS Monaco', foundationDate: '1924', logo: 'https://s.sde.globo.com/media/organizations/2021/05/26/monaco-2021.svg', color: '#E41C23', color2: '#FFFFFF', ratings: { attack: 85, defense: 81, midfield: 83, form: 84, momentum: 75 }, category: 'Ligue 1 (França)' },
    { id: 'marseille', name: 'Marseille', foundationDate: '1899', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/olympique_de_marsella.svg', color: '#0098D7', color2: '#FFFFFF', ratings: { attack: 84, defense: 82, midfield: 83, form: 82, momentum: 75 }, category: 'Ligue 1 (França)' },
    { id: 'lyon', name: 'Lyon', foundationDate: '1950', logo: 'https://s.sde.globo.com/media/organizations/2022/06/30/lyon-2022.svg', color: '#004D98', color2: '#D2122E', ratings: { attack: 83, defense: 80, midfield: 82, form: 81, momentum: 75 }, category: 'Ligue 1 (França)' },
  ],
  "Outros Clubes Europeus": [
    { id: 'ajax', name: 'Ajax', foundationDate: '1900', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/ajax.svg', color: '#D2122E', color2: '#FFFFFF', ratings: { attack: 84, defense: 79, midfield: 85, form: 82, momentum: 75 }, category: 'Outros Clubes Europeus' },
    { id: 'porto', name: 'FC Porto', foundationDate: '1893', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/porto.svg', color: '#00428C', color2: '#FFFFFF', ratings: { attack: 86, defense: 84, midfield: 85, form: 87, momentum: 75 }, category: 'Outros Clubes Europeus' },
    { id: 'benfica', name: 'Benfica', foundationDate: '1904', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/benfica.svg', color: '#E01A22', color2: '#FFFFFF', ratings: { attack: 85, defense: 82, midfield: 84, form: 86, momentum: 75 }, category: 'Outros Clubes Europeus' },
    { id: 'celtic', name: 'Celtic', foundationDate: '1887', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/celtic.svg', color: '#00843D', color2: '#FFFFFF', ratings: { attack: 80, defense: 78, midfield: 81, form: 83, momentum: 75 }, category: 'Outros Clubes Europeus' },
  ],
  "Libertadores (Outros)": [
    { id: 'river-plate', name: 'River Plate', foundationDate: '1901', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/river_plate.svg', color: '#FFFFFF', color2: '#E20613', ratings: { attack: 87, defense: 83, midfield: 86, form: 88, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'boca-juniors', name: 'Boca Juniors', foundationDate: '1905', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/boca_juniors.svg', color: '#00458C', color2: '#F9B200', ratings: { attack: 85, defense: 86, midfield: 84, form: 85, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'racing', name: 'Racing', foundationDate: '1903', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/racing.svg', color: '#8EC9E7', color2: '#FFFFFF', ratings: { attack: 82, defense: 80, midfield: 81, form: 83, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'independiente', name: 'Independiente', foundationDate: '1905', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/independiente.svg', color: '#E20613', color2: '#FFFFFF', ratings: { attack: 81, defense: 79, midfield: 80, form: 80, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'san-lorenzo', name: 'San Lorenzo', foundationDate: '1908', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/san_lorenzo.svg', color: '#00478C', color2: '#D2122E', ratings: { attack: 80, defense: 81, midfield: 80, form: 81, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'penarol', name: 'Peñarol', foundationDate: '1891', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/penarol.svg', color: '#FBC900', color2: '#000000', ratings: { attack: 79, defense: 78, midfield: 79, form: 82, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'nacional-uru', name: 'Nacional', foundationDate: '1899', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/nacional_URU.svg', color: '#FFFFFF', color2: '#00478C', ratings: { attack: 78, defense: 77, midfield: 78, form: 80, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'atletico-nacional', name: 'Atlético Nacional', foundationDate: '1947', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/atletico_nacional.svg', color: '#008039', color2: '#FFFFFF', ratings: { attack: 83, defense: 80, midfield: 82, form: 84, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'millonarios', name: 'Millonarios', foundationDate: '1946', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/millonarios.svg', color: '#0033A0', color2: '#FFFFFF', ratings: { attack: 80, defense: 78, midfield: 79, form: 81, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'america-de-cali', name: 'América de Cali', foundationDate: '1927', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/america_de_cali.svg', color: '#D2122E', color2: '#FFFFFF', ratings: { attack: 79, defense: 77, midfield: 78, form: 79, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'colo-colo', name: 'Colo-Colo', foundationDate: '1925', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/colo_colo.svg', color: '#FFFFFF', color2: '#000000', ratings: { attack: 81, defense: 79, midfield: 80, form: 83, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'universidad-chile', name: 'U. de Chile', foundationDate: '1927', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/universidad_de_chile.svg', color: '#00478C', color2: '#FFFFFF', ratings: { attack: 78, defense: 76, midfield: 77, form: 78, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'universidad-catolica', name: 'U. Católica', foundationDate: '1937', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/universidad_catolica.svg', color: '#FFFFFF', color2: '#00478C', ratings: { attack: 79, defense: 78, midfield: 79, form: 80, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'ldu', name: 'LDU', foundationDate: '1930', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/ldu.svg', color: '#FFFFFF', color2: '#00478C', ratings: { attack: 82, defense: 81, midfield: 82, form: 85, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'barcelona-ecu', name: 'Barcelona SC', foundationDate: '1925', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/barcelona_EQU.svg', color: '#F9B200', color2: '#00478C', ratings: { attack: 80, defense: 77, midfield: 79, form: 81, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'independiente-valle', name: 'I. del Valle', foundationDate: '1958', logo: 'https://s.sde.globo.com/media/organizations/2019/10/24/Independiente-del-Valle.svg', color: '#000000', color2: '#5C4898', ratings: { attack: 83, defense: 79, midfield: 84, form: 86, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'olimpia', name: 'Olimpia', foundationDate: '1902', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/olimpia.svg', color: '#FFFFFF', color2: '#000000', ratings: { attack: 79, defense: 78, midfield: 79, form: 80, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'cerro-porteno', name: 'Cerro Porteño', foundationDate: '1912', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/cerro_porteno.svg', color: '#D2122E', color2: '#00478C', ratings: { attack: 78, defense: 77, midfield: 78, form: 79, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'alianza-lima', name: 'Alianza Lima', foundationDate: '1901', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/alianza_lima.svg', color: '#00478C', color2: '#FFFFFF', ratings: { attack: 77, defense: 75, midfield: 76, form: 78, momentum: 75 }, category: 'Libertadores (Outros)' },
    { id: 'universitario', name: 'Universitario', foundationDate: '1924', logo: 'https://s.sde.globo.com/media/organizations/2019/07/13/universitario.svg', color: '#B51D2A', color2: '#FBE122', ratings: { attack: 76, defense: 74, midfield: 75, form: 77, momentum: 75 }, category: 'Libertadores (Outros)' },
  ]
};

export const INITIAL_TEAMS_DATA = teamData;

export const INITIAL_TEAMS: TeamInfo[] = Object.values(teamData).flat();

export const BALL_COLOR = '#ffffff'; // White

export const PLAYER_MASS = 5;

export const BALL_DEFINITIONS: BallDefinition[] = [
  { id: 'classic', name: 'Clássica', mass: 1, friction: 0.99, bounciness: 0.75 },
  { id: 'heavy', name: 'Pesada', mass: 2.5, friction: 0.97, bounciness: 0.5 },
  { id: 'bouncy', name: 'Saltitante', mass: 0.8, friction: 0.99, bounciness: 0.95 },
  { id: 'fast', name: 'Rápida', mass: 0.9, friction: 0.995, bounciness: 0.7 },
  { id: 'curve', name: 'De Efeito', mass: 1, friction: 0.98, bounciness: 0.7 },
];

export const HALF_TIME_SECONDS = 45 * 60; // 45 minutes in seconds

// --- Buff System Constants ---
export const BUFF_RADIUS = 12;
export const BUFF_SPAWN_SECONDS = 10;
export const BUFF_LIFESPAN_SECONDS = 20;

export const BUFF_DEFINITIONS: Record<BuffType, BuffInfo> = {
  // Attack Buffs
  SPEED_ADVANTAGE: {
    name: 'Vantagem de Velocidade',
    description: 'Aumenta ligeiramente a velocidade de toda a sua equipe.',
    color: '#facc15', symbol: '⚡️', duration: 10 * 60, type: 'attack'
  },
  FIREBALL_SHOT: {
    name: 'Chute de Fogo',
    description: 'Carrega um jogador com um chute potente. Menos poderoso que outras técnicas, mas comum. Dura até ser usado.',
    color: '#f87171', symbol: '🔥', duration: 999 * 60, type: 'attack'
  },
  MAGNETIC_BALL: {
    name: 'Bola Magnética',
    description: 'A bola é levemente atraída para os jogadores da sua equipe.',
    color: '#f472b6', symbol: '🧲', duration: 8 * 60, type: 'attack'
  },
  HOMING_SHOT: {
    name: 'Chute Teleguiado',
    description: 'Carrega um chute que se ajusta levemente em direção ao gol. Dura até ser usado.',
    color: '#06b6d4', symbol: '🎯', duration: 999 * 60, type: 'attack'
  },
  BULLDOZER_SHOT: {
    name: 'Chute Trator',
    description: 'Carrega um chute que empurra os adversários do caminho. Dura até ser usado.',
    color: '#a16207', symbol: '🚜', duration: 999 * 60, type: 'attack'
  },
  TELEPORT_DRIBBLE: {
      name: 'Drible com Teleporte',
      description: 'Um jogador ganha um teleporte de curta distância. Dura até ser usado.',
      color: '#9333ea', symbol: '🌌', duration: 999 * 60, type: 'attack'
  },
   GOAL_SHRINK: {
    name: 'Encolher Gol',
    description: 'Diminui o tamanho do gol adversário por 12 segundos.',
    color: '#78716c', symbol: '🥅🤏', duration: 12 * 60, type: 'attack'
  },
  CHUTE_TIGRE: {
    name: 'Chute do Tigre',
    description: 'Um chute devastador em linha reta que atravessa o campo com imensa força. Dura até ser usado.',
    color: '#f97316', symbol: '🐅', duration: 999 * 60, type: 'attack'
  },
  FURACAO_DE_FOGO: {
    name: 'Furacão de Fogo',
    description: 'Um chute em espiral de fogo, rápido e difícil de prever. Dura até ser usado.',
    color: '#dc2626', symbol: '🌪️🔥', duration: 999 * 60, type: 'attack'
  },
  TIRO_DE_EFEITO: {
    name: 'Tiro de Efeito',
    description: 'Permite um chute que faz uma curva acentuada em direção ao gol. Dura até ser usado.',
    color: '#16a34a', symbol: '💫', duration: 999 * 60, type: 'attack'
  },
  BOLA_DE_CANHÃO: {
    name: 'Bola de Canhão',
    description: 'O próximo chute torna a bola super pesada, movendo-se lentamente mas com grande impacto. Dura até ser usado.',
    color: '#44403c', symbol: '💣', duration: 999 * 60, type: 'attack'
  },
  
  // Defense Buffs
  GOAL_SHIELD: {
    name: 'Escudo de Gol',
    description: 'Cria uma barreira de energia temporária no seu gol.',
    color: '#60a5fa', symbol: '🛡️', duration: 10 * 60, type: 'defense'
  },
  SLOW_GAME: {
    name: 'Jogo Lento',
    description: 'Deixa todos os jogadores da equipe adversária mais lentos.',
    color: '#c084fc', symbol: '🐢', duration: 7 * 60, type: 'defense'
  },
  CONFUSE_RAY: {
    name: 'Raio Confusor',
    description: 'Deixa um jogador adversário tonto por 7 segundos.',
    color: '#eab308', symbol: '🌀', duration: 7 * 60, type: 'defense'
  },
  SHRINK_OPPONENT: {
    name: 'Encolher Adversário',
    description: 'Diminui o tamanho de todos os jogadores adversários.',
    color: '#f97316', symbol: '🤏', duration: 10 * 60, type: 'defense'
  },
  TEAM_GIANTS: {
    name: 'Gigantes em Campo',
    description: 'Aumenta o tamanho de todos os jogadores da sua equipe.',
    color: '#22d3ee', symbol: '💪', duration: 10 * 60, type: 'defense'
  },
  TEMP_RED_CARD: {
      name: 'Cartão Vermelho',
      description: 'Congela um jogador adversário por 5 segundos.',
      color: '#ef4444', symbol: '🟥', duration: 5 * 60, type: 'defense'
  },
  GIANT_GOALIE: {
      name: 'Goleiro Gigante',
      description: 'O jogador mais próximo do seu gol fica enorme.',
      color: '#f59e0b', symbol: '🧤', duration: 10 * 60, type: 'defense'
  },
  GOALIE_INSTINCT: {
    name: 'Instinto de Goleiro',
    description: 'Um jogador corre para defender o gol se a bola estiver em perigo.',
    color: '#8b5cf6', symbol: '🥅', duration: 15 * 60, type: 'defense'
  },
  REPULSOR_FIELD: {
    name: 'Campo Repulsor',
    description: 'Um jogador emite um campo de força que repele adversários próximos.',
    color: '#a78bfa', symbol: '💨', duration: 8 * 60, type: 'defense'
  },
  MÃO_FANTASMA: {
    name: 'Mão Fantasma',
    description: 'O goleiro manifesta uma mão espectral para uma defesa garantida. Uso único por partida.',
    color: '#a855f7', symbol: '✋👻', duration: 30 * 60, type: 'defense', unique: true
  },
  ZONA_MORTA: {
    name: 'Zona Morta',
    description: 'Cria uma armadilha que paralisa o primeiro adversário a entrar nela.',
    color: '#7f1d1d', symbol: '🕸️', duration: 20 * 60, type: 'defense'
  },
  EMPURRAR_LINHA: {
    name: 'Empurrar Linha',
    description: 'Empurra instantaneamente a linha de jogadores adversária para frente.',
    color: '#047857', symbol: '📊', duration: 1, type: 'defense'
  },

  // Utility Buffs
  SWAP_PLAYER: {
      name: 'Troca Tática',
      description: 'Troca de lugar com um adversário aleatório instantaneamente.',
      color: '#db2777', symbol: '⇄', duration: 1, type: 'utility'
  },
  DRIBLE_FANTASMA: {
    name: 'Drible Fantasma',
    description: 'Cria clones ilusórios para confundir os defensores por 6 segundos.',
    color: '#e5e7eb', symbol: '👥', duration: 6 * 60, type: 'utility'
  },
  JOGADOR_CASCUDO: {
    name: 'Jogador Cascudo',
    description: 'Um jogador recebe um pequeno reforço permanente nos atributos. Não reaparece na partida.',
    color: '#fde047', symbol: '⭐', duration: 9999 * 60, type: 'utility', permanent: true
  },
  PURA_ENERGIA: {
    name: 'Pura Energia',
    description: 'Remove efeitos negativos e concede uma pequena aceleração para toda a equipe.',
    color: '#10b981', symbol: '🔋', duration: 1, type: 'utility'
  },
    // New Powerful Shots
  CHUTE_COMETA: {
    name: 'Chute Cometa',
    description: 'Um chute em linha reta extremamente rápido, quase indefensável. Dura até ser usado.',
    color: '#93c5fd', symbol: '☄️', duration: 999 * 60, type: 'attack'
  },
  BOMBA_DE_IMPACTO: {
    name: 'Bomba de Impacto',
    description: 'O próximo chute explode ao tocar em um jogador, empurrando todos ao redor. Dura até ser usado.',
    color: '#fca5a5', symbol: '💥', duration: 999 * 60, type: 'attack'
  },
  CHUTE_FANTASMA: {
    name: 'Chute Fantasma',
    description: 'O próximo chute torna a bola invisível por um curto período. Dura até ser usado.',
    color: '#d1d5db', symbol: '👻', duration: 999 * 60, type: 'attack'
  },
  BROCA_GIRATORIA: {
    name: 'Broca Giratória',
    description: 'Um chute com rotação intensa que tem chance de passar pelo goleiro. Dura até ser usado.',
    color: '#fcd34d', symbol: '⚙️', duration: 999 * 60, type: 'attack'
  },
  CHUTE_DE_DOIS_ESTAGIOS: {
    name: 'Chute de Dois Estágios',
    description: 'O chute começa normal, mas ganha um impulso massivo de velocidade no meio do caminho. Dura até ser usado.',
    color: '#a78bfa', symbol: '🚀', duration: 999 * 60, type: 'attack'
  },
  BOLA_DE_CHUMBO: {
    name: 'Bola de Chumbo',
    description: 'O próximo chute torna a bola extremamente pesada, dificultando a defesa do goleiro. Dura até ser usado.',
    color: '#4b5563', symbol: '⚓', duration: 999 * 60, type: 'attack'
  },

  // New Goalie-Hindering Buffs
  GEL_ESCORREGADIO: {
    name: 'Gel Escorregadio',
    description: 'Cria uma poça de gel escorregadio na frente do gol adversário.',
    color: '#a5f3fc', symbol: '🧊', duration: 15 * 60, type: 'defense'
  },
  CEGUEIRA_TEMPORARIA: {
    name: 'Cegueira Temporária',
    description: 'Deixa o goleiro adversário temporariamente cego, reduzindo sua reação.',
    color: '#3f3f46', symbol: '🕶️', duration: 8 * 60, type: 'defense'
  },
  GOLEIRO_ENCOLHIDO: {
    name: 'Goleiro Encolhido',
    description: 'Encolhe drasticamente o goleiro adversário por um tempo.',
    color: '#7c2d12', symbol: '🐜', duration: 12 * 60, type: 'defense'
  },
  INVERSAO_DE_CONTROLES_GOLEIRO: {
    name: 'Controles Invertidos',
    description: 'Inverte os movimentos do goleiro adversário, fazendo-o se mover na direção oposta.',
    color: '#e11d48', symbol: '↔️', duration: 10 * 60, type: 'defense'
  },
  IMAN_REVERSO: {
    name: 'Imã Reverso',
    description: 'Faz com que o goleiro adversário comece a repelir a bola levemente.',
    color: '#ec4899', symbol: '🔄', duration: 15 * 60, type: 'defense'
  },
  TERREMOTO_NA_AREA: {
    name: 'Terremoto na Área',
    description: 'Causa um terremoto na tela quando a bola entra na área adversária.',
    color: '#ca8a04', symbol: '🌋', duration: 20 * 60, type: 'utility'
  },
};