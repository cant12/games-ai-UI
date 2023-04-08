import { useRef, useEffect } from 'react';
import CannonUtils from '../modules/cannon/CannonUtils';
import GameUtils from './GameUtils';
import "./GameController.css"

// side bar that contains game logs and buttons
function GameController({ gameLog, gameCondition, setGameCondition }) {
    const containerRef = useRef(null);

    useEffect(() => {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    });

    const startButtonOnclick = () => {
        if (gameCondition === GameUtils.GAME_CONDITION.OFF) {
            setGameCondition(GameUtils.GAME_CONDITION.PLAY);
        } else {
            if (window.confirm("All the game content will be lost. Are you sure you want to quit?")) {
                setGameCondition(GameUtils.GAME_CONDITION.OFF);
            }
        }
    };

    const replayButtonClick = () => {
        setGameCondition(GameUtils.GAME_CONDITION.REPLAY);
    };

    const isReplayEnabled = () => {
        return GameUtils.isGameOverCondition(gameCondition);
    };

    let i = 0;
    const gameLogComponent = [];
    for (let log of gameLog) {
        const textClassName = i % 2 ? 'game-log-text white' : 'game-log-text black';
        gameLogComponent.push(
            <input
                key={i}
                className={textClassName}
                type={"text"}
                value={log}
                disabled={true}
            />
        );
        i++;
    }

    return (
        <div style={{ verticalAlign: "middle" }}>
            <div className='game-log-title'>
                GAME LOG
            </div>
            <div className='game-log-box' ref={containerRef}>
                {gameLogComponent}
            </div>
            <div>
                <button className='button' onClick={startButtonOnclick}>
                    {gameCondition === GameUtils.GAME_CONDITION.OFF ? "Start" : "Quit"}
                </button>
            </div>
            <div>
                <button className='button' onClick={replayButtonClick} disabled={!isReplayEnabled()}>
                    Replay
                </button>
            </div>
        </div>
    );
}

export default GameController;