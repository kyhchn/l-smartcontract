'use client'
import { useEffect, useState } from 'react';
import { connectWallet, getProvider } from '../../utils/ethereum';
import { InterfaceAbi, ethers, ContractTransaction } from 'ethers';
import CustomModal from '@/components/customModal';
import vote from '../../utils/Vote.json';
interface Candidate {
    name: string;
    voteCount: number;
}
interface VotingStartedEvent {
    startDate: Date;
    endDate: Date;
}
interface VotingEndedEvent {
    endDate: Date;
}

export default function AdminPage() {
    const [provider, setProvider] = useState<ethers.BrowserProvider>();
    const [errorModalIsOpen, setErrorModalIsOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [contract, setContract] = useState<ethers.Contract>();
    const [VotingStarted, setVotingStarted] = useState<VotingStartedEvent>();
    const [VotingEnded, setVotingEnded] = useState<VotingEndedEvent>();
    const [showCandidates, setShowCandidates] = useState(false);
    const [voterAddress, setVoterAddress] = useState('');
    const [candidateAddress, setCandidateAddress] = useState('');
    const [listCandidate, setListCandidate] = useState<Candidate[]>([]);
    const openModal = (message: string, isError: boolean) => {
        setErrorMessage(message);
        setIsError(isError);
        setErrorModalIsOpen(true);
    };

    const closeErrorModal = () => {
        setErrorModalIsOpen(false);
    };
    function handleVotingStartedEvent(data: any) {
        const startDate = new Date(Number(data.args[0].toString()) * 1000);
        const endDate = new Date(Number(data.args[1].toString()) * 1000);

        const args: VotingStartedEvent = {
            startDate,
            endDate,
        };

        console.log(args);
        setVotingStarted(args);
    }

    function handleVotingEndedEvent(data: any) {
        const endDate = new Date(Number(data.args[0].toString()) * 1000);

        const args: VotingEndedEvent = {
            endDate,
        };

        console.log(args);
        setVotingEnded(args);
    }

    useEffect(() => {
        const initContract = async () => {
            try {
                const provider = await connectWallet();
                setProvider(getProvider());
                if (provider != null) {
                    const signer = (await provider.getSigner());
                    console.log(signer);
                    console.log('provider ada');
                    const abi = vote.abi;
                    const res = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', abi as unknown as InterfaceAbi, signer);
                    const started = res.filters.VotingStarted()
                    const ended = res.filters.VotingEnded()
                    const votingStartedEvents = await res.queryFilter(started);
                    const votingEndedEvents = await res.queryFilter(ended);
                    if (votingEndedEvents.length > 0) {
                        const data = votingEndedEvents[0] as any;
                        handleVotingEndedEvent(data);
                    }
                    if (votingStartedEvents.length > 0) {
                        const data = votingStartedEvents[0] as any;
                        handleVotingStartedEvent(data);
                    }

                    res.on(started, (payload) => {
                        handleVotingStartedEvent(payload);
                    });
                    res.on(ended, (payload) => {
                        handleVotingEndedEvent(payload);
                    });

                    setContract(res);
                }


            } catch (error) {
                console.log(error);
            }
        };
        initContract();
    }, []);

    const getCandidates = async () => {
        setShowCandidates(!showCandidates);
        try {
            const res = await contract?.getCandidates();
            const candidateList = res.map((candidate: Candidate) => {
                return {
                    name: candidate.name,
                    voteCount: Number(candidate.voteCount)
                };
            });
            setListCandidate(candidateList);
            console.log(listCandidate, candidateList)
        } catch (error) {
            console.log(error);
        }
    }

    const registerCandidate = async () => {
        try {
            const signer = await provider?.getSigner()
            console.log(signer)
            contract?.connect(signer!);
            const tx: ContractTransaction = await contract?.registerCandidate(candidateAddress);
            console.log('Candidate registered successfully', tx.data.toString);
            openModal('Sukses mendaftarkan kandidat', false);
        } catch (error) {
            const errorReason = (error as any).reason;
            openModal(errorReason, true);
        }
    };

    const handleRegisterVoter = async () => {
        try {
            await contract!.registerVoter(voterAddress);
            console.log('Voter registered successfully');
            openModal('Sukses mendaftarkan pemilih', false);
        } catch (error) {
            const errorReason = (error as any).reason;
            openModal(errorReason, true);
        }
    };

    const startVote = async () => {
        try {
            await contract!.startVoting();
            openModal('Sukses memulai pemilihan', false);
        } catch (error) {
            const errorReason = (error as any).reason;
            openModal(errorReason, true);
        }
    }
    const endVote = async () => {
        try {
            await contract!.endVoting();
            openModal('Sukses mengakhiri pemilihan', false);
        } catch (error) {
            const errorReason = (error as any).reason;
            openModal(errorReason, true);
        }
    }
    const announceResult = async () => {
        try {
            await contract!.announceResult();
            openModal('Sukses mengumumkan hasil pemilihan', false);
        } catch (error) {
            const errorReason = (error as any).reason;
            openModal(errorReason, true);
        }
    }
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-center text-2xl font-bold mb-8">Panel Admin nich</h1>
            <div className="mb-8 flex flex-row justify-between">
                <div>
                    <input
                        type="text"
                        value={voterAddress}
                        onChange={(e) => setVoterAddress(e.target.value)}
                        placeholder="Enter Voter Address"
                        className="border rounded px-4 py-2"
                    />
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ml-4" onClick={handleRegisterVoter}>
                        Tambahkan Voter
                    </button>
                </div>
                <div>
                    <input
                        type="text"
                        value={candidateAddress}
                        onChange={(e) => setCandidateAddress(e.target.value)}
                        placeholder="Enter Candidate Address"
                        className="border rounded px-4 py-2"
                    />
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ml-4" onClick={registerCandidate}>
                        Add Candidate
                    </button>
                </div>
            </div>
            <div className="mb-8 flex flex-row justify-center gap-20">
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded" onClick={startVote}>
                    Start Vote
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded" onClick={endVote}>
                    End Vote
                </button>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded" onClick={announceResult}>
                    Umumkan Hasil
                </button>
            </div>
            <button className="flex mx-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={getCandidates}>
                {showCandidates ? 'Hide Kandidat' : 'Get Kandidat'}
            </button>
            {showCandidates && (
                <div>
                    <div className="text-xl font-bold mb-4">List Kandidat</div>
                    {listCandidate.map((candidate, index) => (
                        <div key={index} className="bg-gray-100 rounded p-4 mb-4">
                            <p className="font-bold">Name: {candidate.name}</p>
                            <p>Vote Count: {candidate.voteCount}</p>
                        </div>
                    ))}
                </div>
            )}
            <CustomModal
                contentLabel="Error Message"
                errorMessage={errorMessage}
                isOpen={errorModalIsOpen}
                onRequestClose={closeErrorModal}
                isError={isError}
            />
        </div>
    );
}
