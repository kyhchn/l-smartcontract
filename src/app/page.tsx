'use client'
import { useEffect, useState } from 'react';
import { connectWallet, getProvider } from '../utils/ethereum';
import { InterfaceAbi, ethers } from 'ethers';
import CustomModal from '@/components/customModal';
import vote from '../utils/Vote.json';
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
interface ResultAnnouncedEvent {
  winnerId: number;
  name: string;
  voteCount: number;
}


export default function AdminPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [errorModalIsOpen, setErrorModalIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [contract, setContract] = useState<ethers.Contract>();
  const [votingStarted, setVotingStarted] = useState<VotingStartedEvent | null>();
  const [votingEnded, setVotingEnded] = useState<VotingEndedEvent | null>();
  const [votingResult, setVotingResult] = useState<ResultAnnouncedEvent | null>();
  const [listCandidate, setListCandidate] = useState<Candidate[]>([]);
  const [isError, setIsError] = useState(false);
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
  function handleResultAnnouncedEvent(data: any) {
    const winnerId = Number(data.args[0].toString());
    const name = data.args[1].toString();
    const voteCount = Number(data.args[2].toString());

    const args: ResultAnnouncedEvent = {
      winnerId,
      name,
      voteCount,
    };

    console.log(args);
    setVotingStarted(null);
    setVotingEnded(null);
    setVotingResult(args);
  }
  useEffect(() => {
    const fetchCandidates = async (contract: ethers.Contract) => {
      try {
        const candidateRes = await contract.getCandidates();
        const candidateList = candidateRes.map((candidate: Candidate) => {
          return {
            name: candidate.name,
            voteCount: Number(candidate.voteCount)
          }
        })
        setListCandidate(candidateList);
      } catch (error) {
        console.log(error);
      }
    }
    const initContract = async () => {
      try {
        const provider = await connectWallet();
        setProvider(getProvider());
        if (provider != null) {
          const signer = await provider.getSigner();
          const abi = vote.abi;
          console.log(signer)
          const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
          const res = new ethers.Contract(contractAddress, abi as unknown as InterfaceAbi, signer);
          fetchCandidates(res);
          const started = res.filters.VotingStarted()
          const ended = res.filters.VotingEnded()
          const announceResult = res.filters.ResultAnnounced()
          const voted = res.filters.VoteCasted()
          console.log(started)
          const votingStartedEvents = await res.queryFilter(started);
          const votingEndedEvents = await res.queryFilter(ended);
          const resultAnnouncedEvents = await res.queryFilter(announceResult);
          if (resultAnnouncedEvents.length > 0) {
            const data = resultAnnouncedEvents[0] as any;
            handleResultAnnouncedEvent(data);
          }
          if (votingEndedEvents.length > 0) {
            const data = votingEndedEvents[0] as any;
            handleVotingEndedEvent(data);
          }
          if (votingStartedEvents.length > 0) {
            const data = votingStartedEvents[0] as any;
            handleVotingStartedEvent(data);
            console.log(data);
          }
          res.on(voted, (payload) => {
            console.log(payload)
            fetchCandidates(res);
          });
          res.on(started, (payload) => {
            console.log(payload);
            handleVotingStartedEvent(payload);
          });
          res.on(ended, (payload) => {
            console.log(payload);
            handleVotingEndedEvent(payload);
          });
          res.on(announceResult, (payload) => {
            console.log(payload);
            handleResultAnnouncedEvent(payload);
          })
          setContract(res);
        }
      } catch (error) {
        console.log(error);
      }
    };
    initContract();
  }, []);
  const getCandidates = async () => {
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
      const errorReason = (error as any).reason;
      openModal(errorReason, true);
    }
  }

  const castVote = async (candidateAddress: number) => {
    try {
      await contract?.castVote(candidateAddress);
      openModal('Vote berhasil', false);
    } catch (err) {
      const errorReason = (err as any).reason;
      openModal(errorReason, true);
    }
  }
  const handleCardClick = async (candidateName: number) => {
    console.log("Candidate clicked:", candidateName);
    await castVote(candidateName);
  };
  return (
    <div className='py-10'>
      <h1 className='text-center text-5xl font-bold text-white'>Pemilu Anti Ragu</h1>
      {!votingStarted && !votingEnded && !votingResult && (
        <div className='text-center py-5 text-2xl'>
          Masih belum mulai ya
        </div>
      )}
      {votingStarted && votingEnded == null && (
        <div className='px-5'>
          <h1 className='text-center font-semibold text-3xl my-3'>Ayo buruan voting jangan golput :D</h1>
          <div className='flex flex-row items-center justify-between'>
            <p>Mulai {votingStarted.startDate.toString()}</p>
            <p>Sampai {votingStarted.endDate.toString()}</p>
          </div>

          <div className='py-9'>
            <h1 className='text-center text-2xl my-2'>Kandidat</h1>
            <div className='flex flex-row justify-between gap-6'>
              {listCandidate.map((candidate, index) => (
                <div onClick={() => handleCardClick(index)} key={index} className="flex-1 bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer text-center">
                  <h2 className="text-xl font-bold">{candidate.name}</h2>
                  <p className="text-gray-500">Vote Count: {candidate.voteCount}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
      {votingEnded && votingResult == null && (
        <div className='px-5'>
          <h1 className='text-center font-semibold text-3xl my-3'>Yah udh tutup sejak  {votingEnded.endDate.toString()}</h1>
        </div>
      )}
      {votingResult && (
        <div className='px-5'>
          <h1 className='text-center font-semibold text-3xl my-3'>Selamat pada kandidat {votingResult.winnerId + 1} 🎉</h1>
          <p className='text-center font-semibold text-2xl'>Dengan alamat {votingResult.name}</p>
          <p className='text-center font-semibold text-xl'>Perolehan {votingResult.voteCount} suara</p>
        </div>
      )}
      <CustomModal isError={isError} contentLabel='Error Message' errorMessage={errorMessage} isOpen={errorModalIsOpen} onRequestClose={closeErrorModal} />
    </div>
  );
}
