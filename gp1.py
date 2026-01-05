board = [['   ', '   ', '   '], ['   ', '   ', '   '],['   ', '   ', '   ']]
players = [' X ',' O ']
Names = ['PLAYER1','PLAYER2']
currentPlayer = 0
Win = False
menuChoice = -1


def MainMenu():
    print('\nMenu: ')
    print("[1] Play Game.")
    print("[2] Change PlayerNames and PlayerSymbols (DEFAULT- 'X' and 'O).")
    print("[3] Exit.")

def change_settings():
    name = ['PLAYER1', 'PLAYER2']
    symbols = [' X ', ' O ']
    p1_symbol = ''
    p2_symbol = ''

    while True:
        print('\n[1] Change User Names')
        print('[2] Change Symbols')
        print('[3] Save and Exit')

        choice = input('Enter: ')

        if choice == '1':
            name[0] = input('\nPlayer 1: ')
            name[1] = input('Player 2: ')

        elif choice == '2':
            while True:

                print("\nPlease make sure you choose different single letters.")
                p1_symbol = input(f'{name[0]}: ')
                p2_symbol = input(f'{name[1]}: ')

                if len(p1_symbol) == 1 and len(p2_symbol) == 1 and p1_symbol != p2_symbol:

                    symbols[0] = ' ' + p1_symbol + ' '
                    symbols[1] = ' ' + p2_symbol + ' '
                    break

        elif choice == '3':
            return symbols, name

def print_board():
    for row in board:
        print('|'.join(row))
        print('-' * 10)

def checkWin(current, draw):
    # row check
    for row in board:
        if row == [players[current], players[current], players[current]]:
            print(f"Congratulations {Names[current]}[{players[current]}], You Win!!")
            return True
            
        
    # columns check
    for cols in range(len(board)):
        if board[0][cols] == players[current] and board[1][cols] == players[current] and board[2][cols] == players[current]:
            print(f"Congratulations {Names[current]}[{players[current]}], You Win!!")
            return True
        
    # diagonal check
    if board[0][0] == players[current] and board[1][1] == players[current] and board[2][2] == players[current]:
        print(f"Congratulations {Names[current]}[{players[current]}], You Win!!")
        return True

    elif board[0][2] == players[current] and board[1][1] == players[current] and board[2][0] == players[current]:
        print(f"Congratulations {Names[current]}[{players[current]}], You Win!!")
        return True
    
    if draw == 7:
        print('Draw.')
        return True
    
    return False

def PlayGame(a):

    currentPlayer = a
    P1 = 0
    P2 = 0
    Win = False
    draw = 1
    global board

    print('Welcome To TicTacToe.')

    while not Win:

        print(f'{Names[0]}: {players[0]}')
        print(f'{Names[1]}: {players[1]}\n')

        for c in range(9):

            print_board()
            print(f'Turn: {Names[currentPlayer]} [{players[currentPlayer]}]')
            row = int(input('Enter The Row: '))
            col = int(input('Enter The Column: '))

            if board[row - 1][col - 1] == '   ':
                board[row - 1][col - 1] = players[currentPlayer]


                print('\n')

                Win = checkWin(currentPlayer, draw)
                if Win:
                    print_board()
                        
                    if draw != 7:
                        if currentPlayer == 0:
                            P1 += 1
                        else:
                            P2 += 1
                        currentPlayer = currentPlayer + 1

                    choice = input('Press Enter To Play Again: ')
                    
                    if choice == '':
                        Win = False

                        print(f'\n{Names[0]}[{players[0]}]:  {P1}   |   {P2}  :[{players[1]}]{Names[1]}\n')
                        board = [['   ', '   ', '   '], ['   ', '   ', '   '],['   ', '   ', '   ']]
                        draw = 1

                    else:
                        print('\nTHANKS FOR PLAYING.')
                        break

                currentPlayer = (currentPlayer + 1) % 2
                draw = draw + 1

            else:
                print('The place is already occupied.\n')


while menuChoice != 3:
    MainMenu()
    menuChoice = int(input('Please Enter Your MenuChoice: '))

    if menuChoice == 1:
        PlayGame(currentPlayer)
        break
    elif menuChoice == 2:
        players = change_settings()
        Names = players[1]
        players = players[0]
    elif menuChoice == 3:
        break
    else:
        print('Invalid Option.')

